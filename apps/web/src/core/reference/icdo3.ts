/**
 * ICD-O-3 reference data — ILLUSTRATIVE SUBSET.
 *
 * This is NOT the full ICD-O-3.2 classification. It contains a representative set of
 * topography and morphology codes (weighted toward cancers common in Africa: breast,
 * cervix, prostate, liver, Kaposi sarcoma, oesophagus, NHL, etc.) sufficient to drive
 * the validation engine, seed data and demos. A production deployment loads the full,
 * licensed ICD-O-3 code lists from IARC/WHO with multilingual display terms.
 *
 * Source of truth: ICD-O-3, 3rd edition (IARC/WHO). Topography C00–C80, morphology
 * 8000–9993, behaviour /0 /1 /2 /3 /6.
 */
import type { BehaviourCode } from '../types'

export interface TopographyEntry {
  /** 3-character group, e.g. 'C50'. */
  group: string
  /** English term (production loads multilingual terms). */
  term: string
  /** Site restricted to one sex, if any. */
  sex?: 'male' | 'female'
  /** Solid-tumour sites where in-situ behaviour (/2) is implausible (e.g. liver, brain). */
  noInSitu?: boolean
}

export const TOPOGRAPHY: TopographyEntry[] = [
  { group: 'C00', term: 'Lip' },
  { group: 'C01', term: 'Base of tongue' },
  { group: 'C02', term: 'Tongue, other' },
  { group: 'C04', term: 'Floor of mouth' },
  { group: 'C06', term: 'Mouth, other' },
  { group: 'C09', term: 'Tonsil' },
  { group: 'C11', term: 'Nasopharynx' },
  { group: 'C15', term: 'Oesophagus' },
  { group: 'C16', term: 'Stomach' },
  { group: 'C18', term: 'Colon' },
  { group: 'C19', term: 'Rectosigmoid junction' },
  { group: 'C20', term: 'Rectum' },
  { group: 'C22', term: 'Liver and intrahepatic bile ducts', noInSitu: true },
  { group: 'C23', term: 'Gallbladder' },
  { group: 'C25', term: 'Pancreas', noInSitu: true },
  { group: 'C32', term: 'Larynx' },
  { group: 'C34', term: 'Bronchus and lung' },
  { group: 'C40', term: 'Bone and articular cartilage of limbs', noInSitu: true },
  { group: 'C41', term: 'Bone, other and unspecified', noInSitu: true },
  { group: 'C43', term: 'Malignant melanoma of skin' },
  { group: 'C44', term: 'Skin, other' },
  { group: 'C50', term: 'Breast' },
  { group: 'C51', term: 'Vulva', sex: 'female' },
  { group: 'C52', term: 'Vagina', sex: 'female' },
  { group: 'C53', term: 'Cervix uteri', sex: 'female' },
  { group: 'C54', term: 'Corpus uteri', sex: 'female' },
  { group: 'C55', term: 'Uterus, unspecified', sex: 'female' },
  { group: 'C56', term: 'Ovary', sex: 'female' },
  { group: 'C57', term: 'Female genital, other', sex: 'female' },
  { group: 'C58', term: 'Placenta', sex: 'female' },
  { group: 'C60', term: 'Penis', sex: 'male' },
  { group: 'C61', term: 'Prostate', sex: 'male' },
  { group: 'C62', term: 'Testis', sex: 'male' },
  { group: 'C64', term: 'Kidney', noInSitu: true },
  { group: 'C67', term: 'Bladder' },
  { group: 'C70', term: 'Meninges', noInSitu: true },
  { group: 'C71', term: 'Brain', noInSitu: true },
  { group: 'C73', term: 'Thyroid gland' },
  { group: 'C76', term: 'Other and ill-defined sites' },
  { group: 'C77', term: 'Lymph nodes' },
  { group: 'C80', term: 'Unknown primary site', noInSitu: true },
]

export type MorphologyCategory =
  | 'carcinoma'
  | 'sarcoma'
  | 'lymphoma'
  | 'leukaemia'
  | 'melanoma'
  | 'germ-cell'
  | 'nervous'
  | 'neoplasm-nos'

export interface MorphologyEntry {
  /** 4-digit morphology code. */
  code: string
  term: string
  category: MorphologyCategory
  /** Behaviour codes that are valid for this morphology. */
  allowedBehaviour: BehaviourCode[]
  /** True for systemic neoplasms (leukaemia/lymphoma) that should sit at lymph-node/marrow sites. */
  haematologic?: boolean
}

export const MORPHOLOGY: MorphologyEntry[] = [
  { code: '8000', term: 'Neoplasm, malignant', category: 'neoplasm-nos', allowedBehaviour: [1, 3] },
  { code: '8010', term: 'Carcinoma, NOS', category: 'carcinoma', allowedBehaviour: [2, 3] },
  { code: '8070', term: 'Squamous cell carcinoma, NOS', category: 'carcinoma', allowedBehaviour: [2, 3] },
  { code: '8071', term: 'Squamous cell carcinoma, keratinizing', category: 'carcinoma', allowedBehaviour: [2, 3] },
  { code: '8140', term: 'Adenocarcinoma, NOS', category: 'carcinoma', allowedBehaviour: [2, 3] },
  { code: '8500', term: 'Infiltrating duct carcinoma (breast), NOS', category: 'carcinoma', allowedBehaviour: [2, 3] },
  { code: '8501', term: 'Comedocarcinoma, NOS', category: 'carcinoma', allowedBehaviour: [2, 3] },
  { code: '8520', term: 'Lobular carcinoma, NOS', category: 'carcinoma', allowedBehaviour: [2, 3] },
  { code: '8170', term: 'Hepatocellular carcinoma, NOS', category: 'carcinoma', allowedBehaviour: [3] },
  { code: '8260', term: 'Papillary adenocarcinoma, NOS', category: 'carcinoma', allowedBehaviour: [2, 3] },
  { code: '8720', term: 'Malignant melanoma, NOS', category: 'melanoma', allowedBehaviour: [2, 3] },
  { code: '8800', term: 'Sarcoma, NOS', category: 'sarcoma', allowedBehaviour: [3] },
  { code: '8890', term: 'Leiomyosarcoma, NOS', category: 'sarcoma', allowedBehaviour: [3] },
  { code: '9140', term: 'Kaposi sarcoma', category: 'sarcoma', allowedBehaviour: [3] },
  { code: '9380', term: 'Glioma, malignant', category: 'nervous', allowedBehaviour: [3] },
  { code: '9440', term: 'Glioblastoma, NOS', category: 'nervous', allowedBehaviour: [3] },
  { code: '9590', term: 'Malignant lymphoma, NOS', category: 'lymphoma', allowedBehaviour: [3], haematologic: true },
  { code: '9591', term: 'Non-Hodgkin lymphoma, NOS', category: 'lymphoma', allowedBehaviour: [3], haematologic: true },
  { code: '9650', term: 'Hodgkin lymphoma, NOS', category: 'lymphoma', allowedBehaviour: [3], haematologic: true },
  { code: '9680', term: 'Diffuse large B-cell lymphoma, NOS', category: 'lymphoma', allowedBehaviour: [3], haematologic: true },
  { code: '9687', term: 'Burkitt lymphoma, NOS', category: 'lymphoma', allowedBehaviour: [3], haematologic: true },
  { code: '9732', term: 'Plasma cell myeloma', category: 'leukaemia', allowedBehaviour: [3], haematologic: true },
  { code: '9800', term: 'Leukaemia, NOS', category: 'leukaemia', allowedBehaviour: [3], haematologic: true },
  { code: '9811', term: 'B lymphoblastic leukaemia/lymphoma', category: 'leukaemia', allowedBehaviour: [3], haematologic: true },
  { code: '9861', term: 'Acute myeloid leukaemia, NOS', category: 'leukaemia', allowedBehaviour: [3], haematologic: true },
  { code: '9060', term: 'Dysgerminoma', category: 'germ-cell', allowedBehaviour: [3] },
  { code: '9061', term: 'Seminoma, NOS', category: 'germ-cell', allowedBehaviour: [3] },
]

const TOPO_RE = /^C\d{2}(\.\d)?$/
const MORPH_RE = /^\d{4}$/

export function topographyGroup(code: string): string {
  return code.slice(0, 3).toUpperCase()
}

export function isValidTopographyFormat(code: string): boolean {
  return TOPO_RE.test(code.toUpperCase())
}

export function isKnownTopography(code: string): boolean {
  return TOPOGRAPHY.some((t) => t.group === topographyGroup(code))
}

export function topographyEntry(code: string): TopographyEntry | undefined {
  return TOPOGRAPHY.find((t) => t.group === topographyGroup(code))
}

export function isValidMorphologyFormat(code: string): boolean {
  return MORPH_RE.test(code)
}

export function morphologyEntry(code: string): MorphologyEntry | undefined {
  return MORPHOLOGY.find((m) => m.code === code)
}

/**
 * Best-effort ICD-O-3 → ICD-10 crosswalk (illustrative). For most solid tumours the
 * ICD-10 site code mirrors the ICD-O topography group; haematologic neoplasms map by
 * morphology. Production loads the full IARC conversion tables.
 */
export function icdO3ToIcd10(topographyCode: string, morphologyCode: string): string {
  const m = morphologyEntry(morphologyCode)
  if (m?.category === 'lymphoma') return 'C85' // NHL bucket (illustrative)
  if (m?.category === 'leukaemia') return 'C95'
  return topographyGroup(topographyCode)
}
