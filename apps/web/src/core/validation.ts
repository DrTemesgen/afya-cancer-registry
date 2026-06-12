/**
 * Validation / consistency-check engine.
 *
 * Re-implements the spirit of the CanReg5 / IARC consistency checks as a portable rule
 * set: site/histology, behaviour/site, behaviour/morphology, sex/site,
 * basis-of-diagnosis/morphology, date order and age plausibility. Each rule emits a
 * ValidationFinding with an i18n message key; `error` blocks verification, `warning`
 * flags for review.
 *
 * References: ICD-O-3 (IARC), CanReg5 check matrix, IARC/IACR recommendations.
 */
import type { CaseRecord, ValidationFinding } from './types'
import {
  isValidTopographyFormat,
  isKnownTopography,
  topographyEntry,
  isValidMorphologyFormat,
  morphologyEntry,
  topographyGroup,
} from './reference/icdo3'

type Rule = (r: Partial<CaseRecord>) => ValidationFinding[]

// --- partial-date helpers ---
function pdParts(pd?: string): { y?: number; m?: number; d?: number } {
  if (!pd) return {}
  const [y, m, d] = pd.split('-')
  return {
    y: y ? Number(y) : undefined,
    m: m ? Number(m) : undefined,
    d: d ? Number(d) : undefined,
  }
}

/** -1 if a<b, 1 if a>b, 0 if equal/indeterminate, using shared precision. */
function comparePartial(a?: string, b?: string): number {
  const pa = pdParts(a)
  const pb = pdParts(b)
  if (pa.y == null || pb.y == null) return 0
  if (pa.y !== pb.y) return pa.y < pb.y ? -1 : 1
  if (pa.m != null && pb.m != null && pa.m !== pb.m) return pa.m < pb.m ? -1 : 1
  if (pa.d != null && pb.d != null && pa.d !== pb.d) return pa.d < pb.d ? -1 : 1
  return 0
}

const SEX_MALE = 1
const SEX_FEMALE = 2

const rules: Rule[] = [
  // 1. Topography format & known-code.
  (r) => {
    const out: ValidationFinding[] = []
    if (!r.topographyIcdO3) {
      out.push(f('topography-required', 'error', 'validation.topographyRequired', ['topographyIcdO3']))
    } else if (!isValidTopographyFormat(r.topographyIcdO3)) {
      out.push(f('topography-format', 'error', 'validation.topographyFormat', ['topographyIcdO3'], { code: r.topographyIcdO3 }))
    } else if (!isKnownTopography(r.topographyIcdO3)) {
      out.push(f('topography-unknown', 'warning', 'validation.topographyUnknown', ['topographyIcdO3'], { code: r.topographyIcdO3 }))
    }
    return out
  },

  // 2. Morphology format & known-code.
  (r) => {
    const out: ValidationFinding[] = []
    if (!r.morphologyIcdO3) {
      out.push(f('morphology-required', 'error', 'validation.morphologyRequired', ['morphologyIcdO3']))
    } else if (!isValidMorphologyFormat(r.morphologyIcdO3)) {
      out.push(f('morphology-format', 'error', 'validation.morphologyFormat', ['morphologyIcdO3'], { code: r.morphologyIcdO3 }))
    } else if (!morphologyEntry(r.morphologyIcdO3)) {
      out.push(f('morphology-unknown', 'warning', 'validation.morphologyUnknown', ['morphologyIcdO3'], { code: r.morphologyIcdO3 }))
    }
    return out
  },

  // 3. Behaviour / morphology consistency (ICD-O-3).
  (r) => {
    if (r.behaviour == null || !r.morphologyIcdO3) return []
    const m = morphologyEntry(r.morphologyIcdO3)
    if (m && !m.allowedBehaviour.includes(r.behaviour)) {
      return [f('behaviour-morphology', 'error', 'validation.behaviourMorphology', ['behaviour', 'morphologyIcdO3'], { behaviour: r.behaviour, code: r.morphologyIcdO3 })]
    }
    return []
  },

  // 4. Behaviour / site: in-situ implausible at certain solid sites.
  (r) => {
    if (r.behaviour !== 2 || !r.topographyIcdO3) return []
    const t = topographyEntry(r.topographyIcdO3)
    if (t?.noInSitu) {
      return [f('behaviour-site', 'warning', 'validation.behaviourSite', ['behaviour', 'topographyIcdO3'], { site: t.group })]
    }
    return []
  },

  // 5. Site / histology: haematologic neoplasm should sit at lymph nodes; hepatocellular at liver.
  (r) => {
    if (!r.topographyIcdO3 || !r.morphologyIcdO3) return []
    const out: ValidationFinding[] = []
    const g = topographyGroup(r.topographyIcdO3)
    const m = morphologyEntry(r.morphologyIcdO3)
    if (m?.haematologic && !['C77', 'C42', 'C76', 'C80'].includes(g)) {
      out.push(f('site-histology-haem', 'warning', 'validation.siteHistologyHaem', ['topographyIcdO3', 'morphologyIcdO3'], { site: g }))
    }
    if (r.morphologyIcdO3 === '8170' && g !== 'C22') {
      out.push(f('site-histology-hcc', 'warning', 'validation.siteHistologyHcc', ['topographyIcdO3', 'morphologyIcdO3'], { site: g }))
    }
    return out
  },

  // 6. Sex / site (hard constraint).
  (r) => {
    if (!r.topographyIcdO3 || r.sex == null) return []
    const t = topographyEntry(r.topographyIcdO3)
    if (!t?.sex) return []
    if (t.sex === 'female' && r.sex === SEX_MALE) {
      return [f('sex-site', 'error', 'validation.sexSiteFemale', ['sex', 'topographyIcdO3'], { site: t.group })]
    }
    if (t.sex === 'male' && r.sex === SEX_FEMALE) {
      return [f('sex-site', 'error', 'validation.sexSiteMale', ['sex', 'topographyIcdO3'], { site: t.group })]
    }
    return []
  },

  // 7. Basis of diagnosis / morphology.
  (r) => {
    if (r.basisOfDiagnosis == null || !r.morphologyIcdO3) return []
    const out: ValidationFinding[] = []
    const specific = r.morphologyIcdO3 !== '8000' && r.morphologyIcdO3 !== '8010'
    const microscopic = [5, 6, 7, 8].includes(r.basisOfDiagnosis) // cytology/histology/autopsy
    if (specific && !microscopic && r.basisOfDiagnosis !== 9) {
      out.push(f('basis-morphology', 'warning', 'validation.basisMorphology', ['basisOfDiagnosis', 'morphologyIcdO3']))
    }
    if (r.basisOfDiagnosis === 0 && r.vitalStatus !== 2) {
      out.push(f('dco-vital', 'warning', 'validation.dcoVital', ['basisOfDiagnosis', 'vitalStatus']))
    }
    return out
  },

  // 8. Date order: birth ≤ incidence ≤ last contact / death.
  (r) => {
    const out: ValidationFinding[] = []
    if (comparePartial(r.dateOfBirth, r.incidenceDate) > 0) {
      out.push(f('date-birth-incidence', 'error', 'validation.dateBirthIncidence', ['dateOfBirth', 'incidenceDate']))
    }
    if (comparePartial(r.incidenceDate, r.dateOfDeath) > 0) {
      out.push(f('date-incidence-death', 'error', 'validation.dateIncidenceDeath', ['incidenceDate', 'dateOfDeath']))
    }
    if (comparePartial(r.incidenceDate, r.dateOfLastContact) > 0) {
      out.push(f('date-incidence-contact', 'warning', 'validation.dateIncidenceContact', ['incidenceDate', 'dateOfLastContact']))
    }
    return out
  },

  // 9. Age plausibility.
  (r) => {
    const out: ValidationFinding[] = []
    const age = r.ageAtIncidence
    if (age != null) {
      if (age < 0 || age > 120) {
        out.push(f('age-range', 'error', 'validation.ageRange', ['ageAtIncidence'], { age }))
      }
      const g = r.topographyIcdO3 ? topographyGroup(r.topographyIcdO3) : ''
      if (g === 'C61' && age < 30) {
        out.push(f('age-prostate', 'warning', 'validation.ageProstate', ['ageAtIncidence', 'topographyIcdO3'], { age }))
      }
      if (g === 'C53' && age < 15) {
        out.push(f('age-cervix', 'warning', 'validation.ageCervix', ['ageAtIncidence', 'topographyIcdO3'], { age }))
      }
    }
    return out
  },
]

function f(
  rule: string,
  severity: ValidationFinding['severity'],
  messageKey: string,
  fields: string[],
  context?: Record<string, string | number>,
): ValidationFinding {
  return { rule, severity, messageKey, fields, context }
}

/** Run all consistency checks against a (possibly partial) record. */
export function validateCase(record: Partial<CaseRecord>): ValidationFinding[] {
  return rules.flatMap((rule) => rule(record))
}

export function hasErrors(findings: ValidationFinding[]): boolean {
  return findings.some((x) => x.severity === 'error')
}

export function countBySeverity(findings: ValidationFinding[]) {
  return {
    error: findings.filter((x) => x.severity === 'error').length,
    warning: findings.filter((x) => x.severity === 'warning').length,
    info: findings.filter((x) => x.severity === 'info').length,
  }
}
