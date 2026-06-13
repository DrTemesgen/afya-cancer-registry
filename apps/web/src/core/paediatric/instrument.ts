/**
 * REDCap-style data dictionary for the paediatric cancer registry.
 *
 * Mirrors the REDCap instrument model: a registry record is a set of field
 * values; the dictionary defines each field's type, coded choices, validation,
 * required flag and branching ("show only if") logic. The same dictionary
 * drives both the form UI and {@link validatePaedCase}, so the two never drift.
 *
 * The dataset is paediatric-oncology specific — ICCC-3 morphology grouping
 * ({@link ICCC3_GROUPS}), Toronto childhood-cancer staging ({@link TORONTO_STAGED}),
 * anthropometry feeding the WHO z-score engine, and treatment outcome including
 * treatment abandonment (a key paediatric-oncology metric in low-resource
 * settings). See ../../../docs/STANDARDS.md.
 */
import type {
  CodedValue,
  PartialDate,
  SexCode,
  RecordStatus,
  ValidationFinding,
  NutritionStatus,
  PaedAgeBand,
} from '../types'
import { SEX, BASIS_OF_DIAGNOSIS, VITAL_STATUS, TREATMENT_TYPE } from '../valuesets'
import { ICCC3_GROUPS, TORONTO_STAGED } from './iccc'
import { ageInMonths, ageInYears, ageBand } from './age'
import { bmi, classifyNutrition, assessNutrition, type LmsRefProvider } from './zscore'

// --- field model ---

export type PaedFieldType =
  | 'text'
  | 'notes'
  | 'radio'
  | 'dropdown'
  | 'checkbox'
  | 'date'
  | 'integer'
  | 'number'
  | 'yesno'
  | 'calc'

export interface FieldValidation {
  kind?: 'integer' | 'number' | 'date'
  min?: number
  max?: number
}

/** REDCap-style "show this field only if <field> equals <value>". */
export interface BranchCondition {
  field: string
  equals: string | number | boolean
}

export interface PaedField {
  /** stable field name; also the key under which the value is stored. */
  name: string
  /** i18n key for the field label. */
  labelKey: string
  type: PaedFieldType
  /** coded choices for radio/dropdown/checkbox fields. */
  coded?: CodedValue<string | number>[]
  required?: boolean
  validation?: FieldValidation
  branching?: BranchCondition
  /** i18n key for an inline hint. */
  hintKey?: string
  /** which derived value a 'calc' field shows. */
  calc?: 'ageYears' | 'ageBand' | 'bmi' | 'nutrition'
}

export interface PaedInstrument {
  /** stable instrument name. */
  name: string
  /** i18n key for the instrument (section) heading. */
  labelKey: string
  fields: PaedField[]
}

// --- small custom value sets (paediatric-specific) ---

export const TORONTO_TIER: CodedValue<number>[] = [
  { code: 1, key: 'tier1', labels: { en: 'Tier 1 — limited data (e.g. localised / metastatic)' } },
  { code: 2, key: 'tier2', labels: { en: 'Tier 2 — detailed (full stage)' } },
]

export const TREATMENT_STATUS: CodedValue<string>[] = [
  { code: 'ongoing', key: 'ongoing', labels: { en: 'On treatment' } },
  { code: 'completed', key: 'completed', labels: { en: 'Completed' } },
  { code: 'abandoned', key: 'abandoned', labels: { en: 'Abandoned (treatment stopped)' } },
  { code: 'refused', key: 'refused', labels: { en: 'Refused / never started' } },
  { code: 'progression', key: 'progression', labels: { en: 'Progression / relapse' } },
  { code: 'unknown', key: 'unknown', labels: { en: 'Unknown' } },
]

// --- the paediatric cancer data dictionary ---

export const PAED_DICTIONARY: PaedInstrument[] = [
  {
    name: 'demographics',
    labelKey: 'paed.section.demographics',
    fields: [
      { name: 'patientId', labelKey: 'paed.field.patientId', type: 'text', required: true },
      { name: 'sex', labelKey: 'paed.field.sex', type: 'radio', coded: SEX, required: true },
      { name: 'dateOfBirth', labelKey: 'paed.field.dateOfBirth', type: 'date', hintKey: 'paed.hint.partialDate' },
      { name: 'dateOfDiagnosis', labelKey: 'paed.field.dateOfDiagnosis', type: 'date', required: true, hintKey: 'paed.hint.partialDate' },
      { name: 'ageYears', labelKey: 'paed.field.ageYears', type: 'calc', calc: 'ageYears' },
      { name: 'ageBand', labelKey: 'paed.field.ageBand', type: 'calc', calc: 'ageBand' },
    ],
  },
  {
    name: 'diagnosis',
    labelKey: 'paed.section.diagnosis',
    fields: [
      { name: 'icccGroup', labelKey: 'paed.field.icccGroup', type: 'dropdown', coded: ICCC3_GROUPS, required: true },
      { name: 'topographyIcdO3', labelKey: 'paed.field.topography', type: 'text', hintKey: 'paed.hint.icdo3site' },
      { name: 'morphologyIcdO3', labelKey: 'paed.field.morphology', type: 'text', hintKey: 'paed.hint.icdo3morph' },
      { name: 'basisOfDiagnosis', labelKey: 'paed.field.basis', type: 'dropdown', coded: BASIS_OF_DIAGNOSIS },
    ],
  },
  {
    name: 'staging',
    labelKey: 'paed.section.staging',
    fields: [
      { name: 'torontoCancer', labelKey: 'paed.field.torontoCancer', type: 'dropdown', coded: TORONTO_STAGED },
      { name: 'torontoTier', labelKey: 'paed.field.torontoTier', type: 'radio', coded: TORONTO_TIER, branching: { field: 'torontoCancer', equals: '__any__' } },
      { name: 'stageValue', labelKey: 'paed.field.stageValue', type: 'text', hintKey: 'paed.hint.stageValue' },
      { name: 'metastasis', labelKey: 'paed.field.metastasis', type: 'yesno' },
    ],
  },
  {
    name: 'anthropometry',
    labelKey: 'paed.section.anthropometry',
    fields: [
      { name: 'weightKg', labelKey: 'paed.field.weightKg', type: 'number', validation: { kind: 'number', min: 0, max: 150 } },
      { name: 'heightCm', labelKey: 'paed.field.heightCm', type: 'number', validation: { kind: 'number', min: 30, max: 220 } },
      { name: 'bmi', labelKey: 'paed.field.bmi', type: 'calc', calc: 'bmi' },
      { name: 'nutrition', labelKey: 'paed.field.nutrition', type: 'calc', calc: 'nutrition' },
    ],
  },
  {
    name: 'treatment',
    labelKey: 'paed.section.treatment',
    fields: [
      { name: 'treatments', labelKey: 'paed.field.treatments', type: 'checkbox', coded: TREATMENT_TYPE },
      { name: 'treatmentStatus', labelKey: 'paed.field.treatmentStatus', type: 'radio', coded: TREATMENT_STATUS },
    ],
  },
  {
    name: 'outcome',
    labelKey: 'paed.section.outcome',
    fields: [
      { name: 'vitalStatus', labelKey: 'paed.field.vitalStatus', type: 'radio', coded: VITAL_STATUS },
      { name: 'dateOfLastContact', labelKey: 'paed.field.lastContact', type: 'date', hintKey: 'paed.hint.partialDate' },
      { name: 'causeOfDeath', labelKey: 'paed.field.causeOfDeath', type: 'text', branching: { field: 'vitalStatus', equals: 2 } },
    ],
  },
]

/** Flattened view of every field in the dictionary. */
export const PAED_FIELDS: PaedField[] = PAED_DICTIONARY.flatMap((i) => i.fields)

// --- record ---

export type PaedValue = string | number | boolean | string[] | undefined
export type PaedRecordValues = Record<string, PaedValue>

/** A persisted paediatric-cancer registry record (PouchDB document). */
export interface PaedCase {
  _id: string
  _rev?: string
  type: 'paed-case'
  registryNodeId: string
  countryIso: string
  status: RecordStatus
  /** field-name → value, per the dictionary. */
  values: PaedRecordValues
  qcFlags?: ValidationFinding[]
  createdBy: string
  createdAt: string
  updatedBy?: string
  updatedAt?: string
  verifiedBy?: string
  verifiedAt?: string
}

// --- value accessors ---

function asString(v: PaedValue): string | undefined {
  return typeof v === 'string' && v !== '' ? v : undefined
}
function asNumber(v: PaedValue): number | undefined {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v)
  return undefined
}

// --- branching ---

/** Whether a field is visible given current values (REDCap "show only if"). */
export function isFieldVisible(field: PaedField, values: PaedRecordValues): boolean {
  const b = field.branching
  if (!b) return true
  if (b.equals === '__any__') {
    const v = values[b.field]
    return v != null && v !== '' && !(Array.isArray(v) && v.length === 0)
  }
  return values[b.field] === b.equals
}

// --- derived (calc) fields ---

export interface PaedDerived {
  ageMonths: number | null
  ageYears: number | null
  ageBand: PaedAgeBand | null
  bmi: number | null
  nutrition: NutritionStatus
}

/**
 * Compute the derived fields from the entered values. When a WHO LMS reference
 * provider is supplied, nutrition z-scores are computed against it; otherwise
 * (the default) BMI is still derived but z-scores are null/unknown.
 */
export function computeDerived(values: PaedRecordValues, refs?: LmsRefProvider): PaedDerived {
  const dob = asString(values.dateOfBirth) as PartialDate | undefined
  const dx = asString(values.dateOfDiagnosis) as PartialDate | undefined
  const months = ageInMonths(dob, dx)
  const years = ageInYears(dob, dx)
  const weightKg = asNumber(values.weightKg)
  const heightCm = asNumber(values.heightCm)
  const b = bmi(weightKg, heightCm)

  let nutrition: NutritionStatus
  if (refs && months != null) {
    nutrition = assessNutrition({ sex: (asNumber(values.sex) ?? 9) as SexCode, weightKg, heightCm }, refs, months)
  } else {
    nutrition = classifyNutrition({ waz: null, haz: null, bmiz: null })
  }

  return { ageMonths: months, ageYears: years, ageBand: years == null ? null : ageBand(years), bmi: b, nutrition }
}

// --- validation ---

function finding(
  rule: string,
  severity: ValidationFinding['severity'],
  messageKey: string,
  fields: string[],
  context?: Record<string, string | number>,
): ValidationFinding {
  return { rule, severity, messageKey, fields, context }
}

/**
 * Validate a paediatric record against the dictionary (required fields and
 * numeric ranges) plus paediatric-specific domain rules (date order, the
 * 0–19 age window, anthropometry plausibility, cause of death).
 */
export function validatePaedCase(values: PaedRecordValues): ValidationFinding[] {
  const out: ValidationFinding[] = []

  // dictionary-driven: required + numeric range, honouring branching.
  for (const field of PAED_FIELDS) {
    if (field.type === 'calc' || !isFieldVisible(field, values)) continue
    const raw = values[field.name]
    const empty = raw == null || raw === '' || (Array.isArray(raw) && raw.length === 0)
    if (field.required && empty) {
      out.push(finding(`required:${field.name}`, 'error', 'paedValidation.required', [field.name], { field: field.name }))
      continue
    }
    if (!empty && field.validation) {
      const n = asNumber(raw)
      const { min, max } = field.validation
      if (n != null && ((min != null && n < min) || (max != null && n > max))) {
        out.push(finding(`range:${field.name}`, 'warning', 'paedValidation.range', [field.name], { field: field.name, min: min ?? '', max: max ?? '' }))
      }
    }
  }

  // domain: birth must not be after diagnosis.
  const dob = asString(values.dateOfBirth)
  const dx = asString(values.dateOfDiagnosis)
  if (dob && dx && ageInMonths(dob, dx) == null) {
    out.push(finding('date-birth-diagnosis', 'error', 'paedValidation.birthAfterDiagnosis', ['dateOfBirth', 'dateOfDiagnosis']))
  }

  // domain: paediatric registry covers ages 0–19.
  const years = ageInYears(dob, dx)
  if (years != null && years >= 20) {
    out.push(finding('age-paediatric', 'warning', 'paedValidation.outsidePaediatric', ['dateOfBirth', 'dateOfDiagnosis'], { age: years }))
  }

  // domain: cause of death expected when the child has died.
  if (values.vitalStatus === 2 && !asString(values.causeOfDeath)) {
    out.push(finding('cause-of-death', 'info', 'paedValidation.causeOfDeathMissing', ['causeOfDeath']))
  }

  return out
}

export function paedHasErrors(findings: ValidationFinding[]): boolean {
  return findings.some((f) => f.severity === 'error')
}
