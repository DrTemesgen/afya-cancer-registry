import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSession } from '../state/session'
import { icdo3, type CaseRecord } from '../core'
import type { View } from '../App'

export function CaseList({ navigate }: { navigate: (v: View, id?: string) => void }) {
  const { t } = useTranslation()
  const { user, access, cases } = useSession()
  const [q, setQ] = useState('')

  const canCase = access.canViewCaseLevel(user!)
  const scoped = useMemo(
    () => (canCase ? cases.filter((c) => access.inScope(user!, c)) : []),
    [cases, canCase, access, user],
  )

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return scoped
    return scoped.filter((c) => {
      const term = icdo3.topographyEntry(c.topographyIcdO3)?.term ?? ''
      return (
        c.patientId.toLowerCase().includes(needle) ||
        c.topographyIcdO3.toLowerCase().includes(needle) ||
        c.morphologyIcdO3.includes(needle) ||
        term.toLowerCase().includes(needle)
      )
    })
  }, [scoped, q])

  if (!canCase) {
    return (
      <div>
        <h1>{t('cases.title')}</h1>
        <div className="notice warn">{t('cases.restricted')}</div>
      </div>
    )
  }

  return (
    <div>
      <h1>{t('cases.title')}</h1>
      <div className="toolbar" style={{ marginTop: 0, marginBottom: 14 }}>
        <input
          style={{ flex: 1, padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 8 }}
          placeholder={t('cases.searchPlaceholder')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn" onClick={() => navigate('newCase')}>
          + {t('nav.newCase')}
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>{t('case.patientId')}</th>
              <th>{t('common.site')}</th>
              <th>{t('case.morphology')}</th>
              <th>{t('common.sex')}</th>
              <th>{t('common.age')}</th>
              <th>{t('common.year')}</th>
              <th>{t('common.status')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ color: 'var(--muted)' }}>{t('cases.empty')}</td>
              </tr>
            ) : (
              filtered.slice(0, 200).map((c) => <Row key={c._id} c={c} navigate={navigate} />)
            )}
          </tbody>
        </table>
      </div>
      <p className="sub" style={{ marginTop: 10 }}>
        {filtered.length} {t('common.cases')}
      </p>
    </div>
  )
}

function Row({ c, navigate }: { c: CaseRecord; navigate: (v: View, id?: string) => void }) {
  const { t } = useTranslation()
  const site = icdo3.topographyEntry(c.topographyIcdO3)?.term
  return (
    <tr>
      <td>{c.patientId}</td>
      <td>{c.topographyIcdO3}{site ? ` · ${site}` : ''}</td>
      <td>{c.morphologyIcdO3}</td>
      <td>{c.sex === 1 ? '♂' : c.sex === 2 ? '♀' : '–'}</td>
      <td>{c.ageAtIncidence ?? '–'}</td>
      <td>{c.incidenceDate.slice(0, 4)}</td>
      <td>
        <span className={`pill ${c.status}`}>{t(`common.${c.status}`)}</span>
      </td>
      <td>
        <button className="btn secondary" onClick={() => navigate('editCase', c._id)}>
          {t('common.edit')}
        </button>
      </td>
    </tr>
  )
}
