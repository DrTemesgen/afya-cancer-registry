/**
 * Core domain types for the Afya Cancer Registry.
 *
 * The model follows the IARC/IACR core variable set for population-based cancer
 * registries, with optional hospital-based / treatment extensions aligned to mCODE.
 * See ../../docs/DATA-DICTIONARY.md for the human-readable companion.
 */

/** A date that may be only partially known (year, year-month, or full date). ISO-ish string. */
export type PartialDate = string // 'YYYY' | 'YYYY-MM' | 'YYYY-MM-DD'

/** IARC sex coding. */
export type SexCode = 1 | 2 | 3 | 9 // male, female, other, unknown

/** ICD-O-3 behaviour code (last digit of morphology). */
export type BehaviourCode = 0 | 1 | 2 | 3 | 6 // benign, uncertain, in situ, malignant, metastatic

/** ICD-O-3 grade / differentiation. */
export type GradeCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/** IARC basis of diagnosis. Higher = more certain (7 = histology of primary). */
export type BasisOfDiagnosisCode = 0 | 1 | 2 | 4 | 5 | 6 | 7 | 8 | 9

export type VitalStatus = 1 | 2 | 9 // alive, dead, unknown
export type Laterality = 1 | 2 | 3 | 4 | 9 // right, left, bilateral, not applicable, unknown
export type UrbanRural = 1 | 2 | 9

export type StageSystem = 'tnm' | 'essential-tnm' | 'summary'

export type TreatmentType =
  | 'surgery'
  | 'radiotherapy'
  | 'chemotherapy'
  | 'hormone'
  | 'immunotherapy'
  | 'targeted'
  | 'palliative'
  | 'none'
  | 'unknown'

export interface SourceRecord {
  /** e.g. pathology lab, hospital ward, death registry. */
  sourceType: string
  facilityNodeId?: string
  reference?: string
  basisOfDiagnosis?: BasisOfDiagnosisCode
}

export interface Treatment {
  type: TreatmentType
  date?: PartialDate
  intent?: 'curative' | 'palliative' | 'unknown'
  note?: string
}

export type RecordStatus = 'draft' | 'complete' | 'verified'

/**
 * A single registrable cancer (one primary tumour for one patient).
 * In a population-based registry the tumour is the unit of incidence; a patient
 * with multiple primaries has multiple CaseRecords linked by patientId.
 */
export interface CaseRecord {
  // --- document identity (PouchDB/CouchDB) ---
  _id: string
  _rev?: string
  type: 'case'

  // --- patient (pseudonymous in the synced record) ---
  patientId: string
  sex: SexCode
  dateOfBirth?: PartialDate
  ageAtIncidence?: number
  urbanRural?: UrbanRural
  residenceAreaCode?: string // hierarchy node id (subnational)

  // --- tumour / incidence (IARC core) ---
  tumourId: string
  incidenceDate: PartialDate
  topographyIcdO3: string // C00–C80
  morphologyIcdO3: string // 8000–9993
  behaviour: BehaviourCode
  grade?: GradeCode
  laterality?: Laterality
  basisOfDiagnosis: BasisOfDiagnosisCode
  multiplePrimarySeq?: number

  // --- stage ---
  stageSystem?: StageSystem
  stageValue?: string

  // --- sources ---
  sources?: SourceRecord[]

  // --- treatment & outcome (hospital-based / mCODE extension) ---
  treatments?: Treatment[]
  firstCourseIntent?: 'curative' | 'palliative' | 'unknown'

  // --- vital status / follow-up ---
  vitalStatus?: VitalStatus
  dateOfLastContact?: PartialDate
  dateOfDeath?: PartialDate
  causeOfDeathIcd10?: string

  // --- administrative & hierarchy (position at capture time) ---
  facilityNodeId: string
  registryNodeId: string
  subnationalNodeId?: string
  countryIso: string
  auRegion: AuRegionKey

  // --- audit & QC ---
  status: RecordStatus
  createdBy: string
  createdAt: string // ISO timestamp
  updatedBy?: string
  updatedAt?: string
  verifiedBy?: string
  verifiedAt?: string
  qcFlags?: ValidationFinding[]
}

export type AuRegionKey = 'northern' | 'western' | 'central' | 'eastern' | 'southern'

// --- validation ---

export type Severity = 'error' | 'warning' | 'info'

export interface ValidationFinding {
  /** stable rule id, e.g. 'site-histology'. */
  rule: string
  severity: Severity
  /** i18n key for the message. */
  messageKey: string
  /** the field(s) the finding relates to. */
  fields: string[]
  /** optional interpolation values for the message. */
  context?: Record<string, string | number>
}

// --- coded value set entry ---

export interface CodedValue<T extends string | number = string> {
  code: T
  /** stable machine key (language-neutral). */
  key: string
  /** translated display labels keyed by language code. */
  labels: Record<string, string>
}
