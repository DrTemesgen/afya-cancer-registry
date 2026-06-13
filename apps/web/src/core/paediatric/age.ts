/**
 * Paediatric age computation for the childhood-cancer (ICCC) module.
 *
 * Cancer-registry dates of birth and diagnosis are often only partially known
 * (year, year-month, or full date — see {@link PartialDate}). These helpers
 * derive age tolerant of that imprecision and assign the IICC-3 5-year age
 * bands used for childhood/AYA incidence reporting.
 *
 * When a date component is missing it is filled with the middle of its period
 * (month 6, day 15) for *both* endpoints, so the estimate is unbiased rather
 * than systematically rounding age up or down. See ../../../docs/STANDARDS.md.
 */
import type { PartialDate, PaedAgeBand } from '../types'

interface DateParts {
  y: number
  m: number
  d: number
}

/** Parse a partial date, filling unknown month/day with the middle of the period. */
function midParts(pd?: PartialDate): DateParts | null {
  if (!pd) return null
  const [ys, ms, ds] = pd.split('-')
  const y = Number(ys)
  if (!ys || !Number.isFinite(y)) return null
  const m = ms ? Number(ms) : 6
  const d = ds ? Number(ds) : 15
  if (!Number.isFinite(m) || !Number.isFinite(d)) return null
  return { y, m, d }
}

/**
 * Completed age in months between a date of birth and a later date.
 * Returns null if either date lacks a usable year, or if birth is after the
 * measurement date.
 */
export function ageInMonths(dateOfBirth?: PartialDate, at?: PartialDate): number | null {
  const b = midParts(dateOfBirth)
  const t = midParts(at)
  if (!b || !t) return null
  let months = (t.y - b.y) * 12 + (t.m - b.m)
  // Not yet reached the day-of-month anniversary → one fewer completed month.
  if (t.d < b.d) months -= 1
  return months < 0 ? null : months
}

/**
 * Completed age in whole years between a date of birth and a later date.
 * Returns null when {@link ageInMonths} cannot be derived.
 */
export function ageInYears(dateOfBirth?: PartialDate, at?: PartialDate): number | null {
  const months = ageInMonths(dateOfBirth, at)
  return months == null ? null : Math.floor(months / 12)
}

/**
 * Assign an IICC-3 age band from completed years. Ages ≥ 20 (outside the
 * paediatric/AYA range) and negative ages resolve to null.
 */
export function ageBand(years: number): PaedAgeBand | null {
  if (!Number.isFinite(years) || years < 0) return null
  if (years < 1) return '<1'
  if (years < 5) return '1-4'
  if (years < 10) return '5-9'
  if (years < 15) return '10-14'
  if (years < 20) return '15-19'
  return null
}

/** Assign an IICC-3 age band directly from completed months. */
export function ageBandFromMonths(months: number): PaedAgeBand | null {
  if (!Number.isFinite(months) || months < 0) return null
  return ageBand(Math.floor(months / 12))
}

/** True when the age (completed years) falls in the childhood range (0–14). */
export function isChildhoodAge(years: number): boolean {
  return Number.isFinite(years) && years >= 0 && years < 15
}

/** True when the age (completed years) falls in the AYA range (15–19). */
export function isAdolescentYoungAdultAge(years: number): boolean {
  return Number.isFinite(years) && years >= 15 && years < 20
}
