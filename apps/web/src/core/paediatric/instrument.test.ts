import { describe, it, expect } from 'vitest'
import {
  PAED_FIELDS,
  isFieldVisible,
  validatePaedCase,
  paedHasErrors,
  computeDerived,
  type PaedRecordValues,
} from './instrument'

const field = (name: string) => {
  const f = PAED_FIELDS.find((x) => x.name === name)
  if (!f) throw new Error(`no field ${name}`)
  return f
}

const clean: PaedRecordValues = {
  patientId: 'PED-KE-001',
  sex: 2,
  dateOfDiagnosis: '2020-05',
  icccGroup: 'V',
}

describe('isFieldVisible (branching)', () => {
  it('shows cause of death only when the child has died', () => {
    expect(isFieldVisible(field('causeOfDeath'), { vitalStatus: 2 })).toBe(true)
    expect(isFieldVisible(field('causeOfDeath'), { vitalStatus: 1 })).toBe(false)
    expect(isFieldVisible(field('causeOfDeath'), {})).toBe(false)
  })

  it('shows staging tier only once a Toronto cancer type is chosen (__any__)', () => {
    expect(isFieldVisible(field('torontoTier'), { torontoCancer: 'wilms' })).toBe(true)
    expect(isFieldVisible(field('torontoTier'), {})).toBe(false)
    expect(isFieldVisible(field('torontoTier'), { torontoCancer: '' })).toBe(false)
  })

  it('treats unconditional fields as always visible', () => {
    expect(isFieldVisible(field('patientId'), {})).toBe(true)
  })
})

describe('validatePaedCase', () => {
  it('passes a minimal clean record', () => {
    expect(validatePaedCase(clean)).toHaveLength(0)
  })

  it('flags every missing required field', () => {
    const findings = validatePaedCase({})
    const rules = findings.map((f) => f.rule)
    expect(rules).toEqual(
      expect.arrayContaining(['required:patientId', 'required:sex', 'required:dateOfDiagnosis', 'required:icccGroup']),
    )
    expect(paedHasErrors(findings)).toBe(true)
  })

  it('errors when birth is after diagnosis', () => {
    const findings = validatePaedCase({ ...clean, dateOfBirth: '2021', dateOfDiagnosis: '2020' })
    expect(findings.some((f) => f.rule === 'date-birth-diagnosis' && f.severity === 'error')).toBe(true)
  })

  it('warns when age is outside the paediatric/AYA range', () => {
    const findings = validatePaedCase({ ...clean, dateOfBirth: '2000-06', dateOfDiagnosis: '2020-06' })
    expect(findings.some((f) => f.rule === 'age-paediatric' && f.severity === 'warning')).toBe(true)
  })

  it('warns on implausible anthropometry', () => {
    const findings = validatePaedCase({ ...clean, weightKg: 200 })
    expect(findings.some((f) => f.rule === 'range:weightKg' && f.severity === 'warning')).toBe(true)
  })

  it('notes a missing cause of death for a deceased child', () => {
    const findings = validatePaedCase({ ...clean, vitalStatus: 2 })
    expect(findings.some((f) => f.rule === 'cause-of-death' && f.severity === 'info')).toBe(true)
  })
})

describe('computeDerived', () => {
  it('derives age, band and BMI from the entered values', () => {
    const d = computeDerived({ dateOfBirth: '2010-06-15', dateOfDiagnosis: '2020-06-15', weightKg: 30, heightCm: 130 })
    expect(d.ageYears).toBe(10)
    expect(d.ageBand).toBe('10-14')
    expect(d.bmi).toBeCloseTo(17.75, 2)
  })

  it('reports nutrition as unknown without WHO reference tables', () => {
    const d = computeDerived({ weightKg: 12, heightCm: 86 })
    expect(d.nutrition.category).toBe('unknown')
    expect(d.bmi).toBeCloseTo(16.22, 1)
  })
})
