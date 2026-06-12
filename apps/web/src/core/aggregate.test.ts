import { describe, it, expect } from 'vitest'
import { aggregateCases, incidenceRates, rollUp, topSites } from './aggregate'
import { generateSeedCases } from './seed'

describe('aggregation', () => {
  const cases = generateSeedCases(40)
  const cells = aggregateCases(cases)

  it('preserves the total count when aggregating', () => {
    const total = cells.reduce((s, c) => s + c.count, 0)
    expect(total).toBe(cases.length)
  })

  it('rolls up additively to country level', () => {
    const byCountry = rollUp(cells, ['countryIso'])
    const total = byCountry.reduce((s, c) => s + c.count, 0)
    expect(total).toBe(cases.length)
  })

  it('ranks top sites with breast (C50) prominent', () => {
    const top = topSites(cells, 10)
    expect(top.length).toBeGreaterThan(0)
    expect(top.map((s) => s.site)).toContain('C50')
  })

  it('computes positive incidence rates given a population', () => {
    const rates = incidenceRates(cells, 5_000_000, 4)
    expect(rates.crudeRate).toBeGreaterThan(0)
    expect(rates.asrWorld).toBeGreaterThan(0)
  })
})
