/**
 * Anthropometric z-scores and WHO nutrition classification for the paediatric
 * (childhood-cancer) module.
 *
 * Z-scores use the WHO LMS method: for a measured value X and the box-cox
 * parameters L (power), M (median) and S (coefficient of variation) at the
 * child's exact age and sex,
 *
 *     z = ((X / M)^L − 1) / (L · S)        (L ≠ 0)
 *     z = ln(X / M) / S                    (L = 0)
 *
 * with the WHO correction that re-expresses |z| > 3 against the distance
 * between the 2- and 3-SD curves, so extreme tails stay clinically sensible
 * (WHO Child Growth Standards, 2006, §"Computation of centiles and z-scores").
 *
 * The L/M/S reference values are NOT bundled here: the official WHO tables are
 * large and must be loaded verbatim from their published data files. Callers
 * supply them through {@link LmsRefProvider} so this engine ships no unverified
 * medical constants. When a reference for a given age/sex is unavailable the
 * corresponding z-score is null and does not contribute to the classification.
 */
import type { Anthropometry, NutritionStatus, NutritionFlag, SexCode } from '../types'

/** Box-Cox (LMS) parameters at a specific age and sex. */
export interface LmsParams {
  l: number
  m: number
  s: number
}

/**
 * Supplies WHO LMS reference parameters by indicator, sex and completed age in
 * months. Any method may be omitted or return undefined when no reference is
 * available; the dependent z-score then resolves to null.
 */
export interface LmsRefProvider {
  weightForAge?(sex: SexCode, ageMonths: number): LmsParams | undefined
  heightForAge?(sex: SexCode, ageMonths: number): LmsParams | undefined
  bmiForAge?(sex: SexCode, ageMonths: number): LmsParams | undefined
}

/** Value of the LMS curve at a given z (inverse of the z-score formula). */
function lmsValueAt(z: number, p: LmsParams): number {
  return p.l === 0 ? p.m * Math.exp(p.s * z) : p.m * Math.pow(1 + p.l * p.s * z, 1 / p.l)
}

/**
 * WHO LMS z-score for a measured value, with the WHO tail correction for
 * |z| > 3. Returns null for non-positive or non-finite measurements.
 */
export function lmsZScore(value: number, p: LmsParams): number | null {
  if (!Number.isFinite(value) || value <= 0) return null
  const z = p.l === 0 ? Math.log(value / p.m) / p.s : (Math.pow(value / p.m, p.l) - 1) / (p.l * p.s)
  if (z > 3) {
    const sd3 = lmsValueAt(3, p)
    const sd2 = lmsValueAt(2, p)
    return 3 + (value - sd3) / (sd3 - sd2)
  }
  if (z < -3) {
    const sd3 = lmsValueAt(-3, p)
    const sd2 = lmsValueAt(-2, p)
    return -3 + (value - sd3) / (sd2 - sd3)
  }
  return z
}

/** Body-mass index (kg/m²) from weight and height, or null if either is missing. */
export function bmi(weightKg?: number, heightCm?: number): number | null {
  if (weightKg == null || heightCm == null || heightCm <= 0) return null
  const m = heightCm / 100
  return weightKg / (m * m)
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** The three z-scores feeding a nutrition assessment. */
export interface ZScores {
  waz: number | null
  haz: number | null
  bmiz: number | null
}

/**
 * Classify z-scores into WHO nutrition flags and a coarse category.
 *
 * Cutoffs follow the WHO definitions: < −2 SD is moderate and < −3 SD is severe
 * for weight-for-age (underweight), height-for-age (stunting) and BMI-for-age
 * (wasting/thinness); > +2 SD is overweight and > +3 SD is obesity on
 * BMI-for-age. `unknown` is returned only when no z-score is available.
 */
export function classifyNutrition(z: ZScores): NutritionStatus {
  const flags: NutritionFlag[] = []

  if (z.waz != null) {
    if (z.waz < -3) flags.push('severe-underweight')
    else if (z.waz < -2) flags.push('underweight')
  }
  if (z.haz != null) {
    if (z.haz < -3) flags.push('severe-stunting')
    else if (z.haz < -2) flags.push('stunting')
  }
  if (z.bmiz != null) {
    if (z.bmiz < -3) flags.push('severe-wasting')
    else if (z.bmiz < -2) flags.push('wasting')
    else if (z.bmiz > 3) flags.push('obesity')
    else if (z.bmiz > 2) flags.push('overweight')
  }

  const allNull = z.waz == null && z.haz == null && z.bmiz == null
  const severe = flags.some((fl) => fl.startsWith('severe'))
  const moderate = flags.some((fl) => fl === 'underweight' || fl === 'stunting' || fl === 'wasting')
  const over = flags.includes('overweight') || flags.includes('obesity')

  const category: NutritionStatus['category'] = allNull
    ? 'unknown'
    : severe
      ? 'severe'
      : moderate
        ? 'moderate'
        : over
          ? 'overweight'
          : 'normal'

  return {
    waz: z.waz == null ? null : round2(z.waz),
    haz: z.haz == null ? null : round2(z.haz),
    bmiz: z.bmiz == null ? null : round2(z.bmiz),
    category,
    flags,
  }
}

/**
 * Assess nutrition for one measurement, computing the available z-scores from
 * the supplied reference provider and classifying them. `ageMonths` overrides
 * the value on the measurement; if neither is present no age-indexed reference
 * can be looked up and all z-scores are null.
 */
export function assessNutrition(
  a: Anthropometry,
  refs: LmsRefProvider,
  ageMonths?: number,
): NutritionStatus {
  const age = ageMonths ?? a.ageMonths
  const z: ZScores = { waz: null, haz: null, bmiz: null }

  if (age != null && Number.isFinite(age) && age >= 0) {
    if (a.weightKg != null) {
      const p = refs.weightForAge?.(a.sex, age)
      if (p) z.waz = lmsZScore(a.weightKg, p)
    }
    if (a.heightCm != null) {
      const p = refs.heightForAge?.(a.sex, age)
      if (p) z.haz = lmsZScore(a.heightCm, p)
    }
    const b = bmi(a.weightKg, a.heightCm)
    if (b != null) {
      const p = refs.bmiForAge?.(a.sex, age)
      if (p) z.bmiz = lmsZScore(b, p)
    }
  }

  return classifyNutrition(z)
}
