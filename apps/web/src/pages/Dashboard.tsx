import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSession } from '../state/session'
import { BarList, CompareBars, Stat, type BarDatum } from '../components/charts'
import {
  cellsInScope,
  countBy,
  topSites,
  incidenceRates,
  labelFor,
  SEX,
  AGE_GROUPS,
  icdo3,
  type AggregateCell,
} from '../core'
import type { HierarchyNode } from '../core'

/**
 * Illustrative all-sites age-standardised incidence benchmarks (per 100,000), for context
 * only. Production loads GLOBOCAN/CI5 reference values. See dashboard.comparisonNote.
 */
const BENCHMARK = { lmic: 135, global: 190 }

export function Dashboard() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { user, hierarchy, access, aggregates } = useSession()
  const [nodeId, setNodeId] = useState(user!.nodeId)

  const node = hierarchy.get(nodeId)!
  const ancestry = hierarchy.ancestry(nodeId)
  const homeScope = access.visibleScope(user!)
  const children = hierarchy.childrenOf(nodeId).filter((c) => homeScope.has(c.id))
  const cells = useMemo(() => cellsInScope(aggregates, hierarchy, nodeId), [aggregates, hierarchy, nodeId])

  const total = cells.reduce((s, c) => s + c.count, 0)
  const q = quality(cells)
  const population = scopePopulation(hierarchy, node)
  const years = distinctYears(cells)
  const rates = incidenceRates(cells, population, years)

  const aggregatesOnly = access.aggregatesOnly(user!)

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>

      {/* scope breadcrumb (only nodes inside the user's visible scope) */}
      <div className="breadcrumb">
        {ancestry
          .filter((n) => homeScope.has(n.id))
          .map((n, i, arr) => (
            <span key={n.id} style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <button className={n.id === nodeId ? 'current' : ''} onClick={() => setNodeId(n.id)}>
                {n.name}
              </button>
              {i < arr.length - 1 && <span className="sep">›</span>}
            </span>
          ))}
      </div>

      {children.length > 0 && (
        <div className="breadcrumb">
          {children.map((c) => (
            <button key={c.id} onClick={() => setNodeId(c.id)}>
              {c.name} ↓
            </button>
          ))}
        </div>
      )}

      {aggregatesOnly && <div className="notice">{t('dashboard.aggregatesOnly')}</div>}

      {total === 0 ? (
        <div className="card">{t('dashboard.noData')}</div>
      ) : (
        <>
          <div className="grid cols-4">
            <Stat label={t('dashboard.totalCases')} value={total.toLocaleString()} />
            <Stat label={t('dashboard.mvPercent')} value={`${q.mvPercent}%`} tone={q.mvPercent >= 70 ? 'good' : q.mvPercent >= 50 ? 'fair' : 'poor'} />
            <Stat label={t('dashboard.dcoPercent')} value={`${q.dcoPercent}%`} tone={q.dcoPercent <= 10 ? 'good' : q.dcoPercent <= 20 ? 'fair' : 'poor'} />
            <Stat label={t('dashboard.miRatio')} value={q.miRatio.toFixed(2)} />
          </div>

          <div className="grid cols-2" style={{ marginTop: 16 }}>
            <div className="card">
              <h2 style={{ marginTop: 0 }}>{t('dashboard.topSites')}</h2>
              <BarList data={siteData(cells)} unit={t('common.cases')} />
            </div>
            <div className="card">
              <h2 style={{ marginTop: 0 }}>{t('dashboard.bySex')}</h2>
              <BarList data={sexData(cells, lang, t)} unit={t('common.cases')} />
              <h2>{t('dashboard.byYear')}</h2>
              <BarList data={yearData(cells)} unit={t('common.cases')} />
            </div>
          </div>

          <div className="grid cols-2" style={{ marginTop: 16 }}>
            <div className="card">
              <h2 style={{ marginTop: 0 }}>{t('dashboard.byAgeGroup')}</h2>
              <BarList data={ageData(cells)} unit={t('common.cases')} />
            </div>
            <div className="card">
              <h2 style={{ marginTop: 0 }}>{t('dashboard.rates')}</h2>
              {population > 0 ? (
                <div className="grid cols-2">
                  <Stat label={t('dashboard.crudeRate')} value={rates.crudeRate.toFixed(1)} />
                  <Stat label={t('dashboard.asr')} value={rates.asrWorld.toFixed(1)} />
                </div>
              ) : (
                <p className="sub">{t('dashboard.noData')}</p>
              )}
              <p className="help" style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{t('dashboard.asrApprox')}</p>

              <h2>{t('dashboard.comparison')}</h2>
              <CompareBars
                unit="ASR"
                data={[
                  { label: t('dashboard.thisScope'), value: rates.asrWorld, highlight: true },
                  { label: t('dashboard.lmic'), value: BENCHMARK.lmic },
                  { label: t('dashboard.global'), value: BENCHMARK.global },
                ]}
              />
              <p className="help" style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{t('dashboard.comparisonNote')}</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// --- derived data helpers (all from de-identified aggregate cells) ---

function quality(cells: AggregateCell[]) {
  const total = cells.reduce((s, c) => s + c.count, 0)
  const mv = cells.reduce((s, c) => s + c.mvCount, 0)
  const dco = cells.reduce((s, c) => s + c.dcoCount, 0)
  const deaths = cells.reduce((s, c) => s + c.deathCount, 0)
  const pct = (n: number) => (total ? Math.round((n / total) * 1000) / 10 : 0)
  return { total, mvPercent: pct(mv), dcoPercent: pct(dco), miRatio: total ? deaths / total : 0 }
}

function siteData(cells: AggregateCell[]): BarDatum[] {
  return topSites(cells, 8).map((s) => {
    const term = icdo3.topographyEntry(s.site)?.term
    return { label: term ? `${s.site} ${term}` : s.site, value: s.count }
  })
}

function sexData(cells: AggregateCell[], lang: string, t: (k: string) => string): BarDatum[] {
  const m = countBy(cells, 'sex')
  return [...m.entries()]
    .map(([sex, count]) => ({ label: sex === 9 ? t('common.unknown') : labelFor(SEX, sex, lang), value: count }))
    .sort((a, b) => b.value - a.value)
}

function yearData(cells: AggregateCell[]): BarDatum[] {
  const m = countBy(cells, 'year')
  return [...m.entries()]
    .filter(([y]) => y > 0)
    .sort((a, b) => a[0] - b[0])
    .map(([year, count]) => ({ label: String(year), value: count }))
}

function ageData(cells: AggregateCell[]): BarDatum[] {
  const m = countBy(cells, 'ageGroup')
  return AGE_GROUPS.filter((g) => m.has(g)).map((g) => ({ label: g, value: m.get(g)! }))
}

function distinctYears(cells: AggregateCell[]): number {
  const set = new Set(cells.map((c) => c.year).filter((y) => y > 0))
  return Math.max(1, set.size)
}

/** Population denominator for the scope: subnational uses its own; higher tiers sum; registry/facility use nearest subnational ancestor. */
function scopePopulation(hierarchy: ReturnType<typeof useSession>['hierarchy'], node: HierarchyNode): number {
  if (node.type === 'subnational') return node.population ?? 0
  if (node.type === 'registry' || node.type === 'facility') {
    for (const a of hierarchy.ancestry(node.id).reverse()) {
      if (a.type === 'subnational') return a.population ?? 0
    }
    return 0
  }
  return hierarchy.populationWithin(node.id)
}
