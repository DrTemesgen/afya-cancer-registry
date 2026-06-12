/**
 * DHIS2 aggregate export. Converts ACR aggregate cells into a DHIS2 `dataValueSet`
 * payload for national HMIS integration — counts only, no PHI.
 * See ../../docs/INTEROPERABILITY.md §2.
 */
import type { AggregateCell } from './aggregate'
import { rollUp } from './aggregate'

export interface Dhis2Mapping {
  /** ACR registry/country node id → DHIS2 orgUnit id. */
  orgUnit: Record<string, string>
  /** ICD-O-3 topography group → DHIS2 dataElement id. */
  dataElement: Record<string, string>
  /** sex code → DHIS2 categoryOptionCombo id. */
  categoryOptionCombo: Record<number, string>
  /** default org unit if a node is unmapped. */
  defaultOrgUnit?: string
}

export interface Dhis2DataValue {
  dataElement: string
  period: string // e.g. '2023'
  orgUnit: string
  categoryOptionCombo?: string
  value: number
}

export interface Dhis2DataValueSet {
  dataValueSet: { dataValues: Dhis2DataValue[] }
}

export function toDhis2DataValueSet(cells: AggregateCell[], mapping: Dhis2Mapping): Dhis2DataValueSet {
  // collapse to (orgUnit-bearing node, year, site, sex)
  const collapsed = rollUp(cells, ['registryNodeId', 'countryIso', 'year', 'topographyGroup', 'sex'])
  const dataValues: Dhis2DataValue[] = []
  for (const c of collapsed) {
    const orgUnit =
      mapping.orgUnit[c.registryNodeId] ??
      mapping.orgUnit[c.countryIso] ??
      mapping.defaultOrgUnit
    const dataElement = mapping.dataElement[c.topographyGroup]
    if (!orgUnit || !dataElement) continue // unmapped dimension is skipped (logged at deploy)
    dataValues.push({
      dataElement,
      period: String(c.year),
      orgUnit,
      categoryOptionCombo: mapping.categoryOptionCombo[c.sex],
      value: c.count,
    })
  }
  return { dataValueSet: { dataValues } }
}
