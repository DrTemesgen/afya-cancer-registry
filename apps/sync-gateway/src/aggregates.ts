/**
 * Minimal aggregate model for the gateway demo. Mirrors apps/web/src/core/aggregate.ts —
 * in production the gateway imports that shared package and rolls up live CouchDB data.
 * Cells are additive, de-identified (coded dimensions + counts only).
 */

export interface Cell {
  registryNodeId: string
  countryIso: string
  auRegion: string
  year: number
  topographyGroup: string
  sex: number
  count: number
}

/** A small synthetic aggregate set spanning the five AU regions (no PHI). */
export const DEMO_AGGREGATES: Cell[] = [
  { registryNodeId: 'reg-nairobi', countryIso: 'KE', auRegion: 'eastern', year: 2023, topographyGroup: 'C50', sex: 2, count: 41 },
  { registryNodeId: 'reg-nairobi', countryIso: 'KE', auRegion: 'eastern', year: 2023, topographyGroup: 'C53', sex: 2, count: 33 },
  { registryNodeId: 'reg-nairobi', countryIso: 'KE', auRegion: 'eastern', year: 2023, topographyGroup: 'C61', sex: 1, count: 22 },
  { registryNodeId: 'reg-ibadan', countryIso: 'NG', auRegion: 'western', year: 2023, topographyGroup: 'C50', sex: 2, count: 38 },
  { registryNodeId: 'reg-ibadan', countryIso: 'NG', auRegion: 'western', year: 2023, topographyGroup: 'C61', sex: 1, count: 29 },
  { registryNodeId: 'reg-gharbiah', countryIso: 'EG', auRegion: 'northern', year: 2023, topographyGroup: 'C67', sex: 1, count: 18 },
  { registryNodeId: 'reg-gharbiah', countryIso: 'EG', auRegion: 'northern', year: 2023, topographyGroup: 'C50', sex: 2, count: 31 },
  { registryNodeId: 'reg-yaounde', countryIso: 'CM', auRegion: 'central', year: 2023, topographyGroup: 'C53', sex: 2, count: 17 },
  { registryNodeId: 'reg-harare', countryIso: 'ZW', auRegion: 'southern', year: 2023, topographyGroup: 'C44', sex: 1, count: 14 },
  { registryNodeId: 'reg-harare', countryIso: 'ZW', auRegion: 'southern', year: 2023, topographyGroup: 'C53', sex: 2, count: 21 },
]

export interface ScopeQuery {
  registry?: string
  country?: string
  region?: string
}

export function filterByScope(cells: Cell[], scope: ScopeQuery): Cell[] {
  return cells.filter((c) => {
    if (scope.registry) return c.registryNodeId === scope.registry
    if (scope.country) return c.countryIso === scope.country
    if (scope.region) return c.auRegion === scope.region
    return true
  })
}

export function rollUp(cells: Cell[], keep: (keyof Cell)[]): Cell[] {
  const map = new Map<string, Cell>()
  for (const cell of cells) {
    const key = JSON.stringify(keep.map((k) => cell[k]))
    const existing = map.get(key)
    if (existing) existing.count += cell.count
    else map.set(key, { ...cell })
  }
  return [...map.values()]
}

export function toDhis2(cells: Cell[]) {
  const dataValues = rollUp(cells, ['countryIso', 'year', 'topographyGroup', 'sex']).map((c) => ({
    dataElement: `DE-${c.topographyGroup}`,
    period: String(c.year),
    orgUnit: `OU-${c.countryIso}`,
    categoryOptionCombo: c.sex === 1 ? 'COC-male' : c.sex === 2 ? 'COC-female' : 'COC-unknown',
    value: c.count,
  }))
  return { dataValueSet: { dataValues } }
}
