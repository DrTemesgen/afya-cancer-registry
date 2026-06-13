import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useSession } from '../state/session'
import {
  PAED_DICTIONARY,
  isFieldVisible,
  computeDerived,
  validatePaedCase,
  paedHasErrors,
  PaedStore,
  type PaedField,
  type PaedCase,
  type PaedRecordValues,
  type PaedDerived,
} from '../core/paediatric'
import { type User, Hierarchy } from '../core'

function paedContext(user: User, hierarchy: Hierarchy) {
  const ancestry = hierarchy.ancestry(user.nodeId)
  const find = (type: string) => [...ancestry].reverse().find((n) => n.type === type)
  const home = hierarchy.get(user.nodeId)!
  const registry = home.type === 'registry' ? home : find('registry')
  const country = find('country')
  return {
    registryNodeId: registry?.id ?? home.id,
    countryIso: country?.countryIso ?? home.countryIso ?? 'XX',
    registryName: registry?.name ?? home.name,
  }
}

function uid(): string {
  return (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`).slice(0, 8)
}

function newPaedCase(user: User, hierarchy: Hierarchy): PaedCase {
  const ctx = paedContext(user, hierarchy)
  const id = uid()
  return {
    _id: `paed:${ctx.registryNodeId}:${id}`,
    type: 'paed-case',
    registryNodeId: ctx.registryNodeId,
    countryIso: ctx.countryIso,
    status: 'draft',
    values: { patientId: `PED-${ctx.countryIso}-${id}`, sex: 2, vitalStatus: 1 },
    createdBy: user.id,
    createdAt: new Date().toISOString(),
  }
}

export function Paediatric() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { user, hierarchy, access } = useSession()
  const store = useMemo(() => new PaedStore(), [])

  const [list, setList] = useState<PaedCase[]>([])
  const [record, setRecord] = useState<PaedCase>(() => newPaedCase(user!, hierarchy))
  const [savedMsg, setSavedMsg] = useState('')

  const canCase = user ? access.canViewCaseLevel(user) : false

  useEffect(() => {
    if (canCase) void store.all().then(setList)
  }, [store, canCase])

  const values = record.values
  const derived = useMemo<PaedDerived>(() => computeDerived(values), [values])
  const findings = useMemo(() => validatePaedCase(values), [values])
  const blocked = paedHasErrors(findings)
  const errorCount = findings.filter((f) => f.severity === 'error').length
  const warnCount = findings.filter((f) => f.severity === 'warning').length
  const ctxName = paedContext(user!, hierarchy).registryName

  function setValue(name: string, value: PaedRecordValues[string]) {
    setRecord((prev) => ({ ...prev, values: { ...prev.values, [name]: value } }))
    setSavedMsg('')
  }

  async function save(status: PaedCase['status']) {
    const now = new Date().toISOString()
    const next: PaedCase = {
      ...record,
      status,
      qcFlags: findings,
      updatedBy: user!.id,
      updatedAt: now,
      verifiedBy: status === 'verified' ? user!.id : record.verifiedBy,
      verifiedAt: status === 'verified' ? now : record.verifiedAt,
    }
    const saved = await store.put(next)
    setRecord(saved)
    setList((prev) => {
      const idx = prev.findIndex((c) => c._id === saved._id)
      if (idx >= 0) {
        const copy = prev.slice()
        copy[idx] = saved
        return copy
      }
      return [saved, ...prev]
    })
    setSavedMsg(t('paed.savedOk'))
  }

  function startNew() {
    setRecord(newPaedCase(user!, hierarchy))
    setSavedMsg('')
  }

  function edit(c: PaedCase) {
    setRecord({ ...c })
    setSavedMsg('')
  }

  if (!canCase) {
    return (
      <div>
        <h1>{t('paed.title')}</h1>
        <div className="card">{t('cases.restricted')}</div>
      </div>
    )
  }

  return (
    <div>
      <h1>{t('paed.title')}</h1>
      <p className="sub">
        {t('paed.subtitle')} · {t('paed.registry')}: <strong>{ctxName}</strong>
      </p>

      {PAED_DICTIONARY.map((instrument) => (
        <section key={instrument.name}>
          <h2>{t(instrument.labelKey)}</h2>
          <div className="card">
            <div className="form-grid">
              {instrument.fields
                .filter((f) => isFieldVisible(f, values))
                .map((f) => (
                  <FieldControl
                    key={f.name}
                    field={f}
                    value={values[f.name]}
                    derived={derived}
                    lang={lang}
                    t={t}
                    invalid={findings.some((x) => x.fields.includes(f.name) && x.severity === 'error')}
                    onChange={(v) => setValue(f.name, v)}
                  />
                ))}
            </div>
          </div>
        </section>
      ))}

      {/* Consistency checks */}
      <h2>{t('paed.checks')}</h2>
      <div className="card">
        <div className="badge">
          {errorCount} {t('case.errors')} · {warnCount} {t('case.warnings')}
        </div>
        {findings.length === 0 ? (
          <p className="sub" style={{ marginTop: 10 }}>
            {t('case.noFindings')}
          </p>
        ) : (
          <div className="findings">
            {findings.map((f, i) => (
              <div key={i} className={`finding ${f.severity}`}>
                <span className="tag">{f.severity === 'error' ? '✕' : f.severity === 'warning' ? '!' : 'i'}</span>
                <span>{t(f.messageKey, f.context)}</span>
              </div>
            ))}
          </div>
        )}
        <p className="help" style={{ marginTop: 10 }}>
          {t('paed.nutritionNote')}
        </p>
      </div>

      {savedMsg && <div className="notice" style={{ marginTop: 14 }}>{savedMsg}</div>}
      {blocked && <div className="notice warn" style={{ marginTop: 14 }}>{t('case.verifyBlocked')}</div>}

      <div className="toolbar">
        <button className="btn secondary" onClick={startNew}>
          {t('paed.newRecord')}
        </button>
        <button className="btn secondary" onClick={() => void save('draft')}>
          {t('common.saveDraft')}
        </button>
        <button className="btn" onClick={() => void save('complete')}>
          {t('common.save')}
        </button>
        {access.canVerify(user!) && (
          <button className="btn gold" disabled={blocked} onClick={() => void save('verified')}>
            {t('common.verify')}
          </button>
        )}
      </div>

      {/* Saved paediatric cases */}
      <h2 style={{ marginTop: 24 }}>
        {t('paed.savedTitle')} ({list.length})
      </h2>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>{t('paed.field.patientId')}</th>
              <th>{t('paed.field.icccGroup')}</th>
              <th>{t('paed.field.ageBand')}</th>
              <th>{t('common.status')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ color: 'var(--muted)' }}>
                  {t('paed.empty')}
                </td>
              </tr>
            ) : (
              list.map((c) => {
                const d = computeDerived(c.values)
                return (
                  <tr key={c._id}>
                    <td>{String(c.values.patientId ?? '—')}</td>
                    <td>{String(c.values.icccGroup ?? '—')}</td>
                    <td>{d.ageBand ?? '—'}</td>
                    <td>
                      <span className={`pill ${c.status}`}>{t(`common.${c.status}`)}</span>
                    </td>
                    <td>
                      <button className="btn secondary" onClick={() => edit(c)}>
                        {t('common.edit')}
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type TFn = (key: string, opts?: Record<string, unknown>) => string

function FieldControl({
  field,
  value,
  derived,
  lang,
  t,
  invalid,
  onChange,
}: {
  field: PaedField
  value: PaedRecordValues[string]
  derived: PaedDerived
  lang: string
  t: TFn
  invalid: boolean
  onChange: (v: PaedRecordValues[string]) => void
}) {
  const label = t(field.labelKey)
  const hint = field.hintKey ? t(field.hintKey) : undefined

  if (field.type === 'calc') {
    return (
      <Field label={label}>
        <output className="calc">{renderCalc(field, derived, t)}</output>
      </Field>
    )
  }

  if (field.type === 'radio' && field.coded) {
    return (
      <Field label={label} hint={hint} invalid={invalid}>
        <div className="radio-row">
          {field.coded.map((c) => (
            <label key={String(c.code)} className="radio">
              <input
                type="radio"
                name={field.name}
                checked={String(value) === String(c.code)}
                onChange={() => onChange(typeof c.code === 'number' ? c.code : String(c.code))}
              />
              {c.labels[lang] ?? c.labels.en}
            </label>
          ))}
        </div>
      </Field>
    )
  }

  if (field.type === 'dropdown' && field.coded) {
    return (
      <Field label={label} hint={hint} invalid={invalid}>
        <select
          value={value === undefined ? '' : String(value)}
          onChange={(e) => {
            const raw = e.target.value
            if (raw === '') return onChange(undefined)
            const numeric = typeof field.coded![0].code === 'number'
            onChange(numeric ? Number(raw) : raw)
          }}
        >
          <option value="">—</option>
          {field.coded.map((c) => (
            <option key={String(c.code)} value={String(c.code)}>
              {c.labels[lang] ?? c.labels.en}
            </option>
          ))}
        </select>
      </Field>
    )
  }

  if (field.type === 'checkbox' && field.coded) {
    const selected = Array.isArray(value) ? value : []
    return (
      <Field label={label} hint={hint}>
        <div className="check-col">
          {field.coded.map((c) => {
            const code = String(c.code)
            const on = selected.includes(code)
            return (
              <label key={code} className="check">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => onChange(on ? selected.filter((x) => x !== code) : [...selected, code])}
                />
                {c.labels[lang] ?? c.labels.en}
              </label>
            )
          })}
        </div>
      </Field>
    )
  }

  if (field.type === 'yesno') {
    return (
      <Field label={label} hint={hint}>
        <div className="radio-row">
          <label className="radio">
            <input type="radio" name={field.name} checked={value === true} onChange={() => onChange(true)} />
            {t('common.yes')}
          </label>
          <label className="radio">
            <input type="radio" name={field.name} checked={value === false} onChange={() => onChange(false)} />
            {t('common.no')}
          </label>
        </div>
      </Field>
    )
  }

  if (field.type === 'notes') {
    return (
      <Field label={label} hint={hint} invalid={invalid}>
        <textarea value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} />
      </Field>
    )
  }

  const numeric = field.type === 'number' || field.type === 'integer'
  return (
    <Field label={label} hint={hint} invalid={invalid}>
      <input
        type={numeric ? 'number' : 'text'}
        value={value === undefined || value === null ? '' : String(value)}
        step={field.type === 'integer' ? 1 : undefined}
        onChange={(e) => {
          const raw = e.target.value
          if (numeric) return onChange(raw === '' ? undefined : Number(raw))
          onChange(raw)
        }}
      />
    </Field>
  )
}

function renderCalc(field: PaedField, derived: PaedDerived, t: TFn): string {
  switch (field.calc) {
    case 'ageYears':
      return derived.ageYears == null ? '—' : `${derived.ageYears} ${t('paed.years')}`
    case 'ageBand':
      return derived.ageBand ?? '—'
    case 'bmi':
      return derived.bmi == null ? '—' : derived.bmi.toFixed(1)
    case 'nutrition': {
      const n = derived.nutrition
      const cat = t(`paed.nutrition.${n.category}`)
      return n.flags.length ? `${cat} (${n.flags.join(', ')})` : cat
    }
    default:
      return '—'
  }
}

function Field({
  label,
  hint,
  invalid,
  children,
}: {
  label: string
  hint?: string
  invalid?: boolean
  children: ReactNode
}) {
  return (
    <div className={`field${invalid ? ' invalid' : ''}`}>
      <label>{label}</label>
      {children}
      {hint && <span className="help">{hint}</span>}
    </div>
  )
}
