/**
 * IARC registry quality & comparability indicators.
 *
 * MV%  — % microscopically (morphologically) verified (basis ∈ {5,6,7,8})
 * DCO% — % known from death certificate only (basis = 0)
 * M/I  — mortality-to-incidence ratio (completeness signal)
 * % unknown — for age, sex, basis, stage
 *
 * These accompany every comparison so rates are read with their quality caveats visible,
 * never as bare league tables. See ../../docs/STANDARDS.md §4.
 */
import type { CaseRecord } from './types'

export interface QualityIndicators {
  total: number
  mvPercent: number
  dcoPercent: number
  miRatio: number | null
  unknownAgePercent: number
  unknownSexPercent: number
  unknownBasisPercent: number
  unknownStagePercent: number
}

const MICROSCOPIC_BASES = [5, 6, 7, 8]

export function computeQuality(cases: CaseRecord[]): QualityIndicators {
  const total = cases.length
  if (total === 0) {
    return {
      total: 0,
      mvPercent: 0,
      dcoPercent: 0,
      miRatio: null,
      unknownAgePercent: 0,
      unknownSexPercent: 0,
      unknownBasisPercent: 0,
      unknownStagePercent: 0,
    }
  }
  const pct = (n: number) => Math.round((n / total) * 1000) / 10
  const mv = cases.filter((c) => MICROSCOPIC_BASES.includes(c.basisOfDiagnosis)).length
  const dco = cases.filter((c) => c.basisOfDiagnosis === 0).length
  const deaths = cases.filter((c) => c.vitalStatus === 2).length
  return {
    total,
    mvPercent: pct(mv),
    dcoPercent: pct(dco),
    miRatio: total > 0 ? Math.round((deaths / total) * 100) / 100 : null,
    unknownAgePercent: pct(cases.filter((c) => c.ageAtIncidence == null).length),
    unknownSexPercent: pct(cases.filter((c) => c.sex === 9).length),
    unknownBasisPercent: pct(cases.filter((c) => c.basisOfDiagnosis === 9).length),
    unknownStagePercent: pct(cases.filter((c) => !c.stageValue).length),
  }
}

/**
 * A coarse data-quality grade from the indicators, for dashboard badges. Thresholds are
 * indicative (IARC guidance: high MV%, low DCO% are desirable); tune per programme.
 */
export function qualityGrade(q: QualityIndicators): 'good' | 'fair' | 'poor' | 'na' {
  if (q.total === 0) return 'na'
  if (q.mvPercent >= 70 && q.dcoPercent <= 10) return 'good'
  if (q.mvPercent >= 50 && q.dcoPercent <= 20) return 'fair'
  return 'poor'
}
