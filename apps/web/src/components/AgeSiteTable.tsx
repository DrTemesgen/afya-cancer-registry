import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AGE_GROUPS, SEX, labelFor, icdo3, type AggregateCell } from '../core'

/**
 * CI5-style cross-tabulation: cancer site (rows) × five-year age group (columns), with
 * age-specific case numbers and a total. Adopted from IACR's "Cancer Incidence in Five
 * Continents" (CI5) age-specific-numbers view. Works from de-identified aggregate cells.
 */
export function AgeSiteTable({ cells }: { cells: AggregateCell[] }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [sex, setSex] = useState<'all' | 1 | 2>('all')

  const { sites, matrix, colTotals, grand } = useMemo(() => {
    const filtered = sex === 'all' ? cells : cells.filter((c) => c.sex === sex)
    const rowTotal = new Map<string, number>()
    const grid = new Map<string, number>() // key: site|ageGroup
    const cols = new Map<string, number>()
    let total = 0
    for (const c of filtered) {
      rowTotal.set(c.topographyGroup, (rowTotal.get(c.topographyGroup) ?? 0) + c.count)
      const k = `${c.topographyGroup}|${c.ageGroup}`
      grid.set(k, (grid.get(k) ?? 0) + c.count)
      cols.set(c.ageGroup, (cols.get(c.ageGroup) ?? 0) + c.count)
      total += c.count
    }
    const ranked = [...rowTotal.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map((e) => e[0])
    return { sites: ranked, matrix: grid, colTotals: cols, grand: total }
  }, [cells, sex])

  if (grand === 0) return null

  return (
    <div className="card">
      <div className="ci5-head">
        <div>
          <h2 style={{ margin: 0 }}>{t('dashboard.ageSiteTitle')}</h2>
          <p className="sub" style={{ margin: '2px 0 0' }}>{t('dashboard.ageSiteNote')}</p>
        </div>
        <div className="seg">
          <button className={sex === 'all' ? 'on' : ''} onClick={() => setSex('all')}>{t('dashboard.bothSexes')}</button>
          <button className={sex === 1 ? 'on' : ''} onClick={() => setSex(1)}>{labelFor(SEX, 1, lang)}</button>
          <button className={sex === 2 ? 'on' : ''} onClick={() => setSex(2)}>{labelFor(SEX, 2, lang)}</button>
        </div>
      </div>

      <div className="ci5-scroll">
        <table className="ci5">
          <thead>
            <tr>
              <th className="ci5-site">{t('common.site')}</th>
              <th className="ci5-total">{t('common.total')}</th>
              {AGE_GROUPS.map((g) => (
                <th key={g}>{g.replace('-', '–')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sites.map((site) => {
              const term = icdo3.topographyEntry(site)?.term ?? ''
              const rowTotal = AGE_GROUPS.reduce((s, g) => s + (matrix.get(`${site}|${g}`) ?? 0), 0)
              return (
                <tr key={site}>
                  <td className="ci5-site" title={`${site} ${term}`}>
                    <strong>{site}</strong> {term}
                  </td>
                  <td className="ci5-total">{rowTotal}</td>
                  {AGE_GROUPS.map((g) => {
                    const v = matrix.get(`${site}|${g}`) ?? 0
                    return (
                      <td key={g} className={v === 0 ? 'zero' : ''}>
                        {v || '·'}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
            <tr className="ci5-foot">
              <td className="ci5-site">{t('common.total')}</td>
              <td className="ci5-total">{grand}</td>
              {AGE_GROUPS.map((g) => (
                <td key={g}>{colTotals.get(g) ?? 0}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="help" style={{ color: 'var(--muted)', fontSize: '0.76rem', marginTop: 8 }}>
        {t('dashboard.ageSiteFooter')}
      </p>
    </div>
  )
}
