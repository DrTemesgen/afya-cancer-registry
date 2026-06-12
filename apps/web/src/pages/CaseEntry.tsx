import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useSession } from '../state/session'
import {
  validateCase,
  hasErrors,
  countBySeverity,
  icdo3,
  SEX,
  BEHAVIOUR,
  GRADE,
  LATERALITY,
  BASIS_OF_DIAGNOSIS,
  STAGE_SYSTEM,
  VITAL_STATUS,
  TREATMENT_TYPE,
  type CaseRecord,
  type CodedValue,
  type User,
  Hierarchy,
} from '../core'
import type { View } from '../App'

function deriveContext(user: User, hierarchy: Hierarchy) {
  const ancestry = hierarchy.ancestry(user.nodeId)
  const find = (type: string) => [...ancestry].reverse().find((n) => n.type === type)
  const home = hierarchy.get(user.nodeId)!
  let facility = home.type === 'facility' ? home : undefined
  const registry = home.type === 'registry' ? home : find('registry')
  if (!facility && registry) {
    facility = hierarchy.childrenOf(registry.id).find((c) => c.type === 'facility') ?? registry
  }
  const subnational = find('subnational')
  const country = find('country')
  return {
    facilityNodeId: facility?.id ?? home.id,
    registryNodeId: registry?.id ?? home.id,
    subnationalNodeId: subnational?.id,
    countryIso: country?.countryIso ?? home.countryIso ?? 'XX',
    auRegion: (home.auRegion ?? country?.auRegion ?? 'eastern') as CaseRecord['auRegion'],
    facilityName: facility?.name ?? home.name,
  }
}

function newCase(user: User, hierarchy: Hierarchy): CaseRecord {
  const ctx = deriveContext(user, hierarchy)
  const uid = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`).slice(0, 8)
  return {
    _id: `case:${ctx.registryNodeId}:${uid}`,
    type: 'case',
    patientId: `P-${ctx.countryIso}-${uid}`,
    sex: 2,
    tumourId: `T-${uid}`,
    incidenceDate: '',
    topographyIcdO3: '',
    morphologyIcdO3: '',
    behaviour: 3,
    basisOfDiagnosis: 7,
    vitalStatus: 1,
    facilityNodeId: ctx.facilityNodeId,
    registryNodeId: ctx.registryNodeId,
    subnationalNodeId: ctx.subnationalNodeId,
    countryIso: ctx.countryIso,
    auRegion: ctx.auRegion,
    status: 'draft',
    createdBy: user.id,
    createdAt: new Date().toISOString(),
  }
}

export function CaseEntry({ editId, navigate }: { editId?: string; navigate: (v: View, id?: string) => void }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { user, hierarchy, access, cases, saveCase } = useSession()

  const initial = useMemo<CaseRecord>(() => {
    if (editId) {
      const found = cases.find((c) => c._id === editId)
      if (found) return { ...found }
    }
    return newCase(user!, hierarchy)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId])

  const [record, setRecord] = useState<CaseRecord>(initial)
  const [savedMsg, setSavedMsg] = useState('')

  const findings = useMemo(() => validateCase(record), [record])
  const counts = countBySeverity(findings)
  const blocked = hasErrors(findings)
  const ctxName = hierarchy.get(record.facilityNodeId)?.name ?? record.facilityNodeId

  function update<K extends keyof CaseRecord>(field: K, value: CaseRecord[K]) {
    setRecord((prev) => ({ ...prev, [field]: value }))
    setSavedMsg('')
  }

  async function save(status: CaseRecord['status']) {
    const now = new Date().toISOString()
    const next: CaseRecord = {
      ...record,
      status,
      qcFlags: findings,
      updatedBy: user!.id,
      updatedAt: now,
      verifiedBy: status === 'verified' ? user!.id : record.verifiedBy,
      verifiedAt: status === 'verified' ? now : record.verifiedAt,
    }
    await saveCase(next)
    setRecord(next)
    setSavedMsg(t('case.savedOk'))
  }

  return (
    <div>
      <h1>{editId ? t('case.editTitle') : t('case.newTitle')}</h1>
      <p className="sub">
        {t('case.facility')}: <strong>{ctxName}</strong>
      </p>

      {/* Patient */}
      <h2>{t('case.section.patient')}</h2>
      <div className="card">
        <div className="form-grid">
          <Field label={t('case.patientId')}>
            <input value={record.patientId} onChange={(e) => update('patientId', e.target.value)} />
          </Field>
          <CodedSelect label={t('common.sex')} set={SEX} lang={lang} value={record.sex} onChange={(v) => update('sex', v as CaseRecord['sex'])} />
          <Field label={t('case.dateOfBirth')} hint="YYYY / YYYY-MM">
            <input value={record.dateOfBirth ?? ''} onChange={(e) => update('dateOfBirth', e.target.value)} placeholder="1968" />
          </Field>
          <Field label={t('case.ageAtIncidence')} invalid={findings.some((f) => f.fields.includes('ageAtIncidence') && f.severity === 'error')}>
            <input
              type="number"
              value={record.ageAtIncidence ?? ''}
              onChange={(e) => update('ageAtIncidence', e.target.value === '' ? undefined : Number(e.target.value))}
            />
          </Field>
        </div>
      </div>

      {/* Tumour */}
      <h2>{t('case.section.tumour')}</h2>
      <div className="card">
        <div className="form-grid">
          <Field label={t('case.incidenceDate')} hint={t('case.incidenceDateHelp')} invalid={findings.some((f) => f.fields.includes('incidenceDate') && f.severity === 'error')}>
            <input value={record.incidenceDate} onChange={(e) => update('incidenceDate', e.target.value)} placeholder="2023-04" />
          </Field>
          <Field label={t('case.topography')} invalid={findings.some((f) => f.fields.includes('topographyIcdO3') && f.severity === 'error')}>
            <select value={record.topographyIcdO3} onChange={(e) => update('topographyIcdO3', e.target.value)}>
              <option value="">{t('case.selectSite')}</option>
              {icdo3.TOPOGRAPHY.map((tp) => (
                <option key={tp.group} value={tp.group}>
                  {tp.group} · {tp.term}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('case.morphology')} invalid={findings.some((f) => f.fields.includes('morphologyIcdO3') && f.severity === 'error')}>
            <select value={record.morphologyIcdO3} onChange={(e) => update('morphologyIcdO3', e.target.value)}>
              <option value="">{t('case.selectMorphology')}</option>
              {icdo3.MORPHOLOGY.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.code} · {m.term}
                </option>
              ))}
            </select>
          </Field>
          <CodedSelect label={t('case.behaviour')} set={BEHAVIOUR} lang={lang} value={record.behaviour} onChange={(v) => update('behaviour', v as CaseRecord['behaviour'])} />
          <CodedSelect label={t('case.grade')} set={GRADE} lang={lang} value={record.grade} onChange={(v) => update('grade', v as CaseRecord['grade'])} allowEmpty />
          <CodedSelect label={t('case.laterality')} set={LATERALITY} lang={lang} value={record.laterality} onChange={(v) => update('laterality', v as CaseRecord['laterality'])} allowEmpty />
          <CodedSelect label={t('case.basis')} set={BASIS_OF_DIAGNOSIS} lang={lang} value={record.basisOfDiagnosis} onChange={(v) => update('basisOfDiagnosis', v as CaseRecord['basisOfDiagnosis'])} />
        </div>
      </div>

      {/* Stage */}
      <h2>{t('case.section.stage')}</h2>
      <div className="card">
        <div className="form-grid">
          <CodedSelect label={t('case.stageSystem')} set={STAGE_SYSTEM} lang={lang} value={record.stageSystem} onChange={(v) => update('stageSystem', v as CaseRecord['stageSystem'])} allowEmpty />
          <Field label={t('case.stageValue')}>
            <input value={record.stageValue ?? ''} onChange={(e) => update('stageValue', e.target.value)} placeholder="II / T2N1M0 / regional" />
          </Field>
        </div>
      </div>

      {/* Treatment & outcome */}
      <h2>{t('case.section.treatment')}</h2>
      <div className="card">
        <div className="form-grid">
          <CodedSelect
            label={t('case.treatmentType')}
            set={TREATMENT_TYPE}
            lang={lang}
            value={record.treatments?.[0]?.type}
            onChange={(v) => update('treatments', v ? [{ type: v as NonNullable<CaseRecord['treatments']>[number]['type'] }] : undefined)}
            allowEmpty
          />
          <CodedSelect label={t('case.vitalStatus')} set={VITAL_STATUS} lang={lang} value={record.vitalStatus} onChange={(v) => update('vitalStatus', v as CaseRecord['vitalStatus'])} allowEmpty />
          <Field label={t('case.lastContact')} hint="YYYY-MM">
            <input value={record.dateOfLastContact ?? ''} onChange={(e) => update('dateOfLastContact', e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Consistency checks */}
      <h2>{t('case.checks')}</h2>
      <div className="card">
        <div className="badge">
          {counts.error} {t('case.errors')} · {counts.warning} {t('case.warnings')}
        </div>
        {findings.length === 0 ? (
          <p className="sub" style={{ marginTop: 10 }}>{t('case.noFindings')}</p>
        ) : (
          <div className="findings">
            {findings.map((f, i) => (
              <div key={i} className={`finding ${f.severity}`}>
                <span className="tag">{f.severity === 'error' ? '✕' : '!'}</span>
                <span>{t(f.messageKey, f.context)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {savedMsg && <div className="notice" style={{ marginTop: 14 }}>{savedMsg}</div>}
      {blocked && <div className="notice warn" style={{ marginTop: 14 }}>{t('case.verifyBlocked')}</div>}

      <div className="toolbar">
        <button className="btn secondary" onClick={() => navigate('cases')}>{t('common.cancel')}</button>
        <button className="btn secondary" onClick={() => void save('draft')}>{t('common.saveDraft')}</button>
        <button className="btn" onClick={() => void save('complete')}>{t('common.save')}</button>
        {access.canVerify(user!) && (
          <button className="btn gold" disabled={blocked} onClick={() => void save('verified')}>
            {t('common.verify')}
          </button>
        )}
      </div>
    </div>
  )
}

function Field({ label, hint, invalid, children }: { label: string; hint?: string; invalid?: boolean; children: ReactNode }) {
  return (
    <div className={`field${invalid ? ' invalid' : ''}`}>
      <label>{label}</label>
      {children}
      {hint && <span className="help">{hint}</span>}
    </div>
  )
}

function CodedSelect<T extends string | number>({
  label,
  set,
  lang,
  value,
  onChange,
  allowEmpty,
}: {
  label: string
  set: CodedValue<T>[]
  lang: string
  value: T | undefined
  onChange: (v: T | undefined) => void
  allowEmpty?: boolean
}) {
  const isNumeric = set.length > 0 && typeof set[0].code === 'number'
  return (
    <div className="field">
      <label>{label}</label>
      <select
        value={value === undefined ? '' : String(value)}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') return onChange(undefined)
          onChange((isNumeric ? Number(raw) : raw) as T)
        }}
      >
        {allowEmpty && <option value="">—</option>}
        {set.map((v) => (
          <option key={String(v.code)} value={String(v.code)}>
            {v.labels[lang] ?? v.labels.en}
          </option>
        ))}
      </select>
    </div>
  )
}
