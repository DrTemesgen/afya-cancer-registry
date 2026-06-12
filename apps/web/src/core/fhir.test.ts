import { describe, it, expect } from 'vitest'
import { toFhirBundle, fromFhirBundle } from './fhir'
import type { CaseRecord } from './types'

const sample: CaseRecord = {
  _id: 'case:test:1',
  type: 'case',
  patientId: 'P-KE-001',
  sex: 2,
  ageAtIncidence: 49,
  tumourId: 'T-1',
  incidenceDate: '2023-03',
  topographyIcdO3: 'C50',
  morphologyIcdO3: '8500',
  behaviour: 3,
  basisOfDiagnosis: 7,
  vitalStatus: 1,
  stageSystem: 'essential-tnm',
  stageValue: 'II',
  treatments: [{ type: 'surgery' }, { type: 'chemotherapy' }],
  facilityNodeId: 'fac-knh',
  registryNodeId: 'reg-nairobi',
  countryIso: 'KE',
  auRegion: 'eastern',
  status: 'verified',
  createdBy: 'seed',
  createdAt: '2023-03-15T09:00:00.000Z',
}

describe('FHIR / mCODE mapping', () => {
  const bundle = toFhirBundle(sample) as any

  it('produces a transaction Bundle with Patient and Condition', () => {
    expect(bundle.resourceType).toBe('Bundle')
    const types = bundle.entry.map((e: any) => e.resource.resourceType)
    expect(types).toContain('Patient')
    expect(types).toContain('Condition')
    expect(types).toContain('Observation') // histology + stage
  })

  it('encodes topography as bodySite and morphology in the condition code', () => {
    const condition = bundle.entry.map((e: any) => e.resource).find((r: any) => r.resourceType === 'Condition')
    expect(condition.bodySite[0].coding[0].code).toBe('C50')
    expect(condition.code.coding[0].code).toBe('8500')
  })

  it('emits treatment resources (surgery + medication)', () => {
    const types = bundle.entry.map((e: any) => e.resource.resourceType)
    expect(types).toContain('Procedure')
    expect(types).toContain('MedicationStatement')
  })

  it('round-trips core fields back from an mCODE bundle', () => {
    const recovered = fromFhirBundle(bundle)
    expect(recovered.sex).toBe(2)
    expect(recovered.topographyIcdO3).toBe('C50')
    expect(recovered.morphologyIcdO3).toBe('8500')
  })
})
