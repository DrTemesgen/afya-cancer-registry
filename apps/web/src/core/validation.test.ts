import { describe, it, expect } from 'vitest'
import { validateCase, hasErrors } from './validation'
import type { CaseRecord } from './types'

function base(overrides: Partial<CaseRecord> = {}): Partial<CaseRecord> {
  return {
    sex: 2,
    dateOfBirth: '1970',
    ageAtIncidence: 53,
    incidenceDate: '2023-05',
    topographyIcdO3: 'C50',
    morphologyIcdO3: '8500',
    behaviour: 3,
    basisOfDiagnosis: 7,
    vitalStatus: 1,
    ...overrides,
  }
}

describe('validateCase', () => {
  it('passes a clean breast-cancer record', () => {
    const findings = validateCase(base())
    expect(hasErrors(findings)).toBe(false)
  })

  it('flags a sex/site conflict (prostate in a female)', () => {
    const findings = validateCase(base({ sex: 2, topographyIcdO3: 'C61', morphologyIcdO3: '8140' }))
    expect(findings.some((f) => f.rule === 'sex-site' && f.severity === 'error')).toBe(true)
  })

  it('rejects an invalid behaviour for a morphology', () => {
    // 8170 hepatocellular carcinoma is malignant-only (/3); in-situ (/2) is invalid
    const findings = validateCase(base({ topographyIcdO3: 'C22', morphologyIcdO3: '8170', behaviour: 2 }))
    expect(findings.some((f) => f.rule === 'behaviour-morphology' && f.severity === 'error')).toBe(true)
  })

  it('detects birth after incidence', () => {
    const findings = validateCase(base({ dateOfBirth: '2024', incidenceDate: '2023' }))
    expect(findings.some((f) => f.rule === 'date-birth-incidence')).toBe(true)
  })

  it('warns when lymphoma is recorded at a solid site', () => {
    const findings = validateCase(base({ topographyIcdO3: 'C50', morphologyIcdO3: '9680' }))
    expect(findings.some((f) => f.rule === 'site-histology-haem' && f.severity === 'warning')).toBe(true)
  })
})
