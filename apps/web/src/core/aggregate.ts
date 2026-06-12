/**
 * Aggregation engine — turns case records into the de-identified count cube that
 * federates up the hierarchy, and computes incidence counts, crude rates and
 * age-standardised rates (ASR, World/Segi standard) for dashboards.
 *
 * The aggregate cell is the only thing that crosses the PHI boundary (Tier 2 → 3+):
 * it carries coded dimensions and counts, never a patient or a date finer than year.
 * See ../../docs/SYNC.md §2.
 */
import type { CaseRecord, SexCode } from './types'
import { ageGroupFor, AGE_GROUPS, type AgeGroup } from './valuesets'
import { topographyGroup } from './reference/icdo3'
import { Hierarchy } from './hierarchy'

export interface AggregateCell {
  type: 'aggregate'
  registryNodeId: string
  countryIso: string
  auRegion: string
  year: number
  topographyGroup: string
  sex: SexCode
  ageGroup: AgeGroup | 'unknown'
  basisOfDiagnosis: number
  stage: string
  count: number
  /** quality counters carried for roll-up. */
  mvCount: number
  dcoCount: number
  deathCount: number
}

const MICROSCOPIC_BASES = [5, 6, 7, 8]

function cellKey(c: Omit<AggregateCell, 'count' | 'mvCount' | 'dcoCount' | 'deathCount' | 'type'>): string {
  return [
    c.registryNodeId,
    c.countryIso,
    c.auRegion,
    c.year,
    c.topographyGroup,
    c.sex,
    c.ageGroup,
    c.basisOfDiagnosis,
    c.stage,
  ].join('|')
}

function yearOf(pd: string): number {
  return Number(pd.slice(0, 4)) || 0
}

/** Collapse case records into additive aggregate cells (the up-tier payload). */
export function aggregateCases(cases: CaseRecord[]): AggregateCell[] {
  const map = new Map<string, AggregateCell>()
  for (const c of cases) {
    const dims = {
      registryNodeId: c.registryNodeId,
      countryIso: c.countryIso,
      auRegion: c.auRegion,
      year: yearOf(c.incidenceDate),
      topographyGroup: topographyGroup(c.topographyIcdO3),
      sex: c.sex,
      ageGroup: ageGroupFor(c.ageAtIncidence),
      basisOfDiagnosis: c.basisOfDiagnosis,
      stage: c.stageValue || 'unknown',
    }
    const key = cellKey(dims)
    const existing = map.get(key)
    const inc = {
      count: 1,
      mvCount: MICROSCOPIC_BASES.includes(c.basisOfDiagnosis) ? 1 : 0,
      dcoCount: c.basisOfDiagnosis === 0 ? 1 : 0,
      deathCount: c.vitalStatus === 2 ? 1 : 0,
    }
    if (existing) {
      existing.count += inc.count
      existing.mvCount += inc.mvCount
      existing.dcoCount += inc.dcoCount
      existing.deathCount += inc.deathCount
    } else {
      map.set(key, { type: 'aggregate', ...dims, ...inc })
    }
  }
  return [...map.values()]
}

/** Sum cells (e.g. registries → country). Cells are additive by construction. */
export function rollUp(cells: AggregateCell[], dimsToKeep: (keyof AggregateCell)[]): AggregateCell[] {
  const map = new Map<string, AggregateCell>()
  for (const cell of cells) {
    const keyObj: Record<string, unknown> = {}
    for (const d of dimsToKeep) keyObj[d] = cell[d]
    const key = JSON.stringify(keyObj)
    const existing = map.get(key)
    if (existing) {
      existing.count += cell.count
      existing.mvCount += cell.mvCount
      existing.dcoCount += cell.dcoCount
      existing.deathCount += cell.deathCount
    } else {
      map.set(key, { ...cell })
    }
  }
  return [...map.values()]
}

// --- counts by dimension (for charts) ---

export function countBy<K extends keyof AggregateCell>(
  cells: AggregateCell[],
  dim: K,
): Map<AggregateCell[K], number> {
  const out = new Map<AggregateCell[K], number>()
  for (const c of cells) out.set(c[dim], (out.get(c[dim]) ?? 0) + c.count)
  return out
}

export function topSites(cells: AggregateCell[], n = 10): { site: string; count: number }[] {
  const m = countBy(cells, 'topographyGroup')
  return [...m.entries()]
    .map(([site, count]) => ({ site: site as string, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
}

// --- rates ---

/** World (Segi) standard population weights per 100,000, for the 18 five-year age groups. */
export const WORLD_STANDARD: Record<AgeGroup, number> = {
  '0-4': 12000, '5-9': 10000, '10-14': 9000, '15-19': 9000, '20-24': 8000,
  '25-29': 8000, '30-34': 6000, '35-39': 6000, '40-44': 6000, '45-49': 6000,
  '50-54': 5000, '55-59': 4000, '60-64': 4000, '65-69': 3000, '70-74': 2000,
  '75-79': 1000, '80-84': 500, '85+': 500,
}

/**
 * Representative young African age structure (proportions per age group). Used ONLY to
 * approximate age-group denominators from a total population for the demo ASR — a
 * production registry uses real age-structured census denominators.
 */
const AFRICAN_AGE_DISTRIBUTION: Record<AgeGroup, number> = {
  '0-4': 0.160, '5-9': 0.140, '10-14': 0.120, '15-19': 0.110, '20-24': 0.095,
  '25-29': 0.080, '30-34': 0.065, '35-39': 0.055, '40-44': 0.045, '45-49': 0.035,
  '50-54': 0.028, '55-59': 0.022, '60-64': 0.017, '65-69': 0.012, '70-74': 0.008,
  '75-79': 0.005, '80-84': 0.003, '85+': 0.002,
}

export interface IncidenceRates {
  cases: number
  population: number
  /** crude rate per 100,000 per year. */
  crudeRate: number
  /** age-standardised rate per 100,000 (World standard). */
  asrWorld: number
  /** true if ASR used the modelled age distribution (no real age-structured denominator). */
  asrApproximated: boolean
}

/**
 * Incidence rates for a set of aggregate cells over `years`, against a total population.
 * If age-group populations are unknown, the modelled African distribution approximates them.
 */
export function incidenceRates(cells: AggregateCell[], population: number, years: number): IncidenceRates {
  const cases = cells.reduce((s, c) => s + c.count, 0)
  if (population <= 0 || years <= 0) {
    return { cases, population, crudeRate: 0, asrWorld: 0, asrApproximated: true }
  }
  const crudeRate = (cases / population / years) * 100000

  // cases per age group
  const casesByAge = new Map<AgeGroup, number>()
  for (const c of cells) {
    if (c.ageGroup === 'unknown') continue
    casesByAge.set(c.ageGroup, (casesByAge.get(c.ageGroup) ?? 0) + c.count)
  }
  const distSum = AGE_GROUPS.reduce((s, g) => s + AFRICAN_AGE_DISTRIBUTION[g], 0)
  const stdSum = AGE_GROUPS.reduce((s, g) => s + WORLD_STANDARD[g], 0)

  let weighted = 0
  for (const g of AGE_GROUPS) {
    const popG = (population * (AFRICAN_AGE_DISTRIBUTION[g] / distSum)) * years
    const rateG = popG > 0 ? ((casesByAge.get(g) ?? 0) / popG) * 100000 : 0
    weighted += rateG * WORLD_STANDARD[g]
  }
  const asrWorld = weighted / stdSum

  return {
    cases,
    population,
    crudeRate: round1(crudeRate),
    asrWorld: round1(asrWorld),
    asrApproximated: true,
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** Aggregate cells restricted to a hierarchy scope (node + descendants). */
export function cellsInScope(cells: AggregateCell[], hierarchy: Hierarchy, nodeId: string): AggregateCell[] {
  const scope = hierarchy.descendants(nodeId)
  return cells.filter(
    (c) => scope.has(c.registryNodeId) || scope.has(c.countryIso),
  )
}
