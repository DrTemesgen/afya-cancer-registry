import { describe, it, expect } from 'vitest'
import {
  ageInMonths,
  ageInYears,
  ageBand,
  ageBandFromMonths,
  isChildhoodAge,
  isAdolescentYoungAdultAge,
} from './age'

describe('ageInMonths', () => {
  it('computes completed months from full dates', () => {
    expect(ageInMonths('2020-01-15', '2021-01-15')).toBe(12)
    expect(ageInMonths('2020-01-15', '2020-07-15')).toBe(6)
  })

  it('subtracts a month before the day-of-month anniversary', () => {
    expect(ageInMonths('2020-01-20', '2020-02-10')).toBe(0)
    expect(ageInMonths('2020-01-20', '2020-02-25')).toBe(1)
  })

  it('fills unknown month/day with mid-period for both endpoints', () => {
    // both year-only → mid-year (June 15) on each side → exactly 12 months
    expect(ageInMonths('2019', '2020')).toBe(12)
  })

  it('returns null on missing or out-of-order dates', () => {
    expect(ageInMonths(undefined, '2020')).toBeNull()
    expect(ageInMonths('2020', undefined)).toBeNull()
    expect(ageInMonths('2021', '2020')).toBeNull()
  })
})

describe('ageInYears', () => {
  it('floors to completed years', () => {
    expect(ageInYears('2010-06-15', '2021-06-15')).toBe(11)
    expect(ageInYears('2010-06-15', '2021-05-01')).toBe(10)
  })

  it('propagates null', () => {
    expect(ageInYears(undefined, '2020')).toBeNull()
  })
})

describe('ageBand', () => {
  it('maps the IICC-3 5-year bands at their boundaries', () => {
    expect(ageBand(0)).toBe('<1')
    expect(ageBand(0.9)).toBe('<1')
    expect(ageBand(1)).toBe('1-4')
    expect(ageBand(4)).toBe('1-4')
    expect(ageBand(5)).toBe('5-9')
    expect(ageBand(9)).toBe('5-9')
    expect(ageBand(10)).toBe('10-14')
    expect(ageBand(14)).toBe('10-14')
    expect(ageBand(15)).toBe('15-19')
    expect(ageBand(19)).toBe('15-19')
  })

  it('returns null outside the paediatric/AYA range', () => {
    expect(ageBand(20)).toBeNull()
    expect(ageBand(53)).toBeNull()
    expect(ageBand(-1)).toBeNull()
  })
})

describe('ageBandFromMonths', () => {
  it('bands from completed months', () => {
    expect(ageBandFromMonths(11)).toBe('<1')
    expect(ageBandFromMonths(12)).toBe('1-4')
    expect(ageBandFromMonths(180)).toBe('15-19')
    expect(ageBandFromMonths(240)).toBeNull()
  })
})

describe('age range predicates', () => {
  it('classifies childhood vs AYA', () => {
    expect(isChildhoodAge(0)).toBe(true)
    expect(isChildhoodAge(14)).toBe(true)
    expect(isChildhoodAge(15)).toBe(false)
    expect(isAdolescentYoungAdultAge(15)).toBe(true)
    expect(isAdolescentYoungAdultAge(19)).toBe(true)
    expect(isAdolescentYoungAdultAge(20)).toBe(false)
  })
})
