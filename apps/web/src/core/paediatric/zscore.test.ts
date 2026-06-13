import { describe, it, expect } from 'vitest'
import {
  lmsZScore,
  bmi,
  classifyNutrition,
  assessNutrition,
  type LmsParams,
  type LmsRefProvider,
} from './zscore'
import type { Anthropometry } from '../types'

// Synthetic LMS so the formula is tested independently of any real WHO table.
const LINEAR: LmsParams = { l: 1, m: 10, s: 0.1 } // value(z) = 10 + z
const LOGNORMAL: LmsParams = { l: 0, m: 10, s: 0.2 } // value(z) = 10·e^(0.2z)

describe('lmsZScore', () => {
  it('is 0 at the median and exact within ±3 SD', () => {
    expect(lmsZScore(10, LINEAR)).toBeCloseTo(0, 10)
    expect(lmsZScore(12, LINEAR)).toBeCloseTo(2, 10)
    expect(lmsZScore(13, LINEAR)).toBeCloseTo(3, 10)
    expect(lmsZScore(10, LOGNORMAL)).toBeCloseTo(0, 10)
  })

  it('handles L = 0 (lognormal) within range', () => {
    // value at z=2 is 10·e^0.4 = 14.918
    expect(lmsZScore(10 * Math.exp(0.4), LOGNORMAL)).toBeCloseTo(2, 6)
  })

  it('applies the WHO tail correction beyond +3 SD', () => {
    // sd3 = 10·e^0.6 = 18.221; at the boundary z is exactly 3
    expect(lmsZScore(10 * Math.exp(0.6), LOGNORMAL)).toBeCloseTo(3, 6)
    // value 20 is past sd3 → linear extrapolation off the 2–3 SD gap
    expect(lmsZScore(20, LOGNORMAL)).toBeCloseTo(3.5386, 3)
  })

  it('applies the WHO tail correction beyond −3 SD', () => {
    expect(lmsZScore(5, LOGNORMAL)).toBeCloseTo(-3.4017, 3)
  })

  it('returns null for non-positive or non-finite values', () => {
    expect(lmsZScore(0, LINEAR)).toBeNull()
    expect(lmsZScore(-4, LINEAR)).toBeNull()
    expect(lmsZScore(NaN, LINEAR)).toBeNull()
  })
})

describe('bmi', () => {
  it('computes kg/m²', () => {
    expect(bmi(16, 100)).toBeCloseTo(16, 10)
  })
  it('returns null when inputs are missing or invalid', () => {
    expect(bmi(undefined, 100)).toBeNull()
    expect(bmi(16, undefined)).toBeNull()
    expect(bmi(16, 0)).toBeNull()
  })
})

describe('classifyNutrition', () => {
  it('returns unknown when no z-score is available', () => {
    const s = classifyNutrition({ waz: null, haz: null, bmiz: null })
    expect(s.category).toBe('unknown')
    expect(s.flags).toEqual([])
  })

  it('flags moderate and severe underweight (weight-for-age)', () => {
    expect(classifyNutrition({ waz: -2.5, haz: null, bmiz: null })).toMatchObject({
      category: 'moderate',
      flags: ['underweight'],
    })
    expect(classifyNutrition({ waz: -3.2, haz: null, bmiz: null })).toMatchObject({
      category: 'severe',
      flags: ['severe-underweight'],
    })
  })

  it('flags stunting (height-for-age) and wasting (BMI-for-age)', () => {
    expect(classifyNutrition({ waz: null, haz: -2.1, bmiz: null }).flags).toContain('stunting')
    expect(classifyNutrition({ waz: null, haz: -3.5, bmiz: null }).flags).toContain('severe-stunting')
    expect(classifyNutrition({ waz: null, haz: null, bmiz: -2.5 }).flags).toContain('wasting')
    expect(classifyNutrition({ waz: null, haz: null, bmiz: -3.5 }).flags).toContain('severe-wasting')
  })

  it('flags overweight and obesity (BMI-for-age), category overweight', () => {
    expect(classifyNutrition({ waz: null, haz: null, bmiz: 2.5 })).toMatchObject({
      category: 'overweight',
      flags: ['overweight'],
    })
    const ob = classifyNutrition({ waz: null, haz: null, bmiz: 3.5 })
    expect(ob.flags).toContain('obesity')
    expect(ob.category).toBe('overweight')
  })

  it('reports normal when all z-scores are in range, and rounds to 2 dp', () => {
    const s = classifyNutrition({ waz: -0.5, haz: 0.2, bmiz: 0.12345 })
    expect(s.category).toBe('normal')
    expect(s.flags).toEqual([])
    expect(s.bmiz).toBe(0.12)
  })
})

describe('assessNutrition', () => {
  const refs: LmsRefProvider = {
    weightForAge: () => ({ l: 1, m: 12, s: 0.1 }),
    heightForAge: () => ({ l: 1, m: 90, s: 0.04 }),
    bmiForAge: () => ({ l: 1, m: 16, s: 0.08 }),
  }

  it('computes z-scores from the provider and classifies them', () => {
    const a: Anthropometry = { sex: 1, ageMonths: 24, weightKg: 9, heightCm: 86 }
    const s = assessNutrition(a, refs)
    expect(s.waz).toBe(-2.5)
    expect(s.haz).toBe(-1.11)
    expect(s.bmiz).toBe(-2.99)
    expect(s.category).toBe('moderate')
    expect(s.flags).toEqual(expect.arrayContaining(['underweight', 'wasting']))
  })

  it('returns unknown when age is not derivable', () => {
    const s = assessNutrition({ sex: 1, weightKg: 9 }, refs)
    expect(s.category).toBe('unknown')
    expect(s.waz).toBeNull()
  })

  it('honours the ageMonths override', () => {
    const s = assessNutrition({ sex: 1, weightKg: 9 }, refs, 24)
    expect(s.waz).toBe(-2.5)
  })

  it('leaves a z-score null when its reference is not provided', () => {
    const weightOnly: LmsRefProvider = { weightForAge: () => ({ l: 1, m: 12, s: 0.1 }) }
    const s = assessNutrition({ sex: 1, ageMonths: 24, weightKg: 9, heightCm: 86 }, weightOnly)
    expect(s.waz).toBe(-2.5)
    expect(s.haz).toBeNull()
    expect(s.bmiz).toBeNull()
  })
})
