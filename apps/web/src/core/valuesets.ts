/**
 * Coded value sets for the registry, with translated labels for the six African
 * Union working languages: en, fr, pt, es, sw, ar.
 *
 * Each value carries a language-neutral `key` (stable for mappings/exports) and a
 * `labels` map. Reference classifications (ICD-O-3, ICD-10/11, TNM) are NOT here —
 * they live under ./reference and are loaded (full lists) at deploy time.
 */
import type {
  CodedValue,
  SexCode,
  BehaviourCode,
  BasisOfDiagnosisCode,
  GradeCode,
  VitalStatus,
  Laterality,
  TreatmentType,
  StageSystem,
  AuRegionKey,
} from './types'

export const LANG_CODES = ['en', 'fr', 'pt', 'es', 'sw', 'ar'] as const
export type LangCode = (typeof LANG_CODES)[number]

const L = (en: string, fr: string, pt: string, es: string, sw: string, ar: string) => ({
  en,
  fr,
  pt,
  es,
  sw,
  ar,
})

export const SEX: CodedValue<SexCode>[] = [
  { code: 1, key: 'male', labels: L('Male', 'Masculin', 'Masculino', 'Masculino', 'Mwanaume', 'ذكر') },
  { code: 2, key: 'female', labels: L('Female', 'Féminin', 'Feminino', 'Femenino', 'Mwanamke', 'أنثى') },
  { code: 3, key: 'other', labels: L('Other', 'Autre', 'Outro', 'Otro', 'Nyingine', 'آخر') },
  { code: 9, key: 'unknown', labels: L('Unknown', 'Inconnu', 'Desconhecido', 'Desconocido', 'Haijulikani', 'غير معروف') },
]

export const BEHAVIOUR: CodedValue<BehaviourCode>[] = [
  { code: 0, key: 'benign', labels: L('Benign', 'Bénin', 'Benigno', 'Benigno', 'Salama (benign)', 'حميد') },
  { code: 1, key: 'uncertain', labels: L('Uncertain', 'Incertain', 'Incerto', 'Incierto', 'Isiyo na uhakika', 'غير مؤكد') },
  { code: 2, key: 'insitu', labels: L('In situ', 'In situ', 'In situ', 'In situ', 'In situ', 'موضعي') },
  { code: 3, key: 'malignant', labels: L('Malignant', 'Malin', 'Maligno', 'Maligno', 'Hatari (malignant)', 'خبيث') },
  { code: 6, key: 'metastatic', labels: L('Metastatic', 'Métastatique', 'Metastático', 'Metastásico', 'Metastatiki', 'نقيلي') },
]

export const BASIS_OF_DIAGNOSIS: CodedValue<BasisOfDiagnosisCode>[] = [
  { code: 0, key: 'dco', labels: L('Death certificate only', 'Certificat de décès uniquement', 'Apenas certidão de óbito', 'Solo certificado de defunción', 'Cheti cha kifo pekee', 'شهادة الوفاة فقط') },
  { code: 1, key: 'clinical', labels: L('Clinical', 'Clinique', 'Clínico', 'Clínico', 'Kliniki', 'سريري') },
  { code: 2, key: 'clinical-investigation', labels: L('Clinical investigation', 'Investigation clinique', 'Investigação clínica', 'Investigación clínica', 'Uchunguzi wa kliniki', 'فحص سريري') },
  { code: 4, key: 'tumour-markers', labels: L('Specific tumour markers', 'Marqueurs tumoraux', 'Marcadores tumorais', 'Marcadores tumorales', 'Alama za uvimbe', 'واسمات الورم') },
  { code: 5, key: 'cytology', labels: L('Cytology', 'Cytologie', 'Citologia', 'Citología', 'Saitologia', 'علم الخلايا') },
  { code: 6, key: 'histology-metastasis', labels: L('Histology of metastasis', 'Histologie de métastase', 'Histologia de metástase', 'Histología de metástasis', 'Histolojia ya metastasi', 'نسيج النقيلة') },
  { code: 7, key: 'histology-primary', labels: L('Histology of primary', 'Histologie de la tumeur primitive', 'Histologia do tumor primário', 'Histología del primario', 'Histolojia ya uvimbe wa msingi', 'نسيج الورم الأولي') },
  { code: 8, key: 'autopsy', labels: L('Autopsy with histology', 'Autopsie avec histologie', 'Autópsia com histologia', 'Autopsia con histología', 'Uchunguzi wa maiti na histolojia', 'تشريح مع فحص نسيجي') },
  { code: 9, key: 'unknown', labels: L('Unknown', 'Inconnu', 'Desconhecido', 'Desconocido', 'Haijulikani', 'غير معروف') },
]

export const GRADE: CodedValue<GradeCode>[] = [
  { code: 1, key: 'g1', labels: L('Well differentiated', 'Bien différencié', 'Bem diferenciado', 'Bien diferenciado', 'Imetofautishwa vyema', 'جيد التمايز') },
  { code: 2, key: 'g2', labels: L('Moderately differentiated', 'Moyennement différencié', 'Moderadamente diferenciado', 'Moderadamente diferenciado', 'Wastani', 'متوسط التمايز') },
  { code: 3, key: 'g3', labels: L('Poorly differentiated', 'Peu différencié', 'Pouco diferenciado', 'Poco diferenciado', 'Duni', 'ضعيف التمايز') },
  { code: 4, key: 'g4', labels: L('Undifferentiated', 'Indifférencié', 'Indiferenciado', 'Indiferenciado', 'Haijatofautishwa', 'غير متمايز') },
  { code: 9, key: 'unknown', labels: L('Unknown / not stated', 'Inconnu', 'Desconhecido', 'Desconocido', 'Haijulikani', 'غير معروف') },
]

export const VITAL_STATUS: CodedValue<VitalStatus>[] = [
  { code: 1, key: 'alive', labels: L('Alive', 'Vivant', 'Vivo', 'Vivo', 'Hai', 'على قيد الحياة') },
  { code: 2, key: 'dead', labels: L('Dead', 'Décédé', 'Falecido', 'Fallecido', 'Amefariki', 'متوفى') },
  { code: 9, key: 'unknown', labels: L('Unknown', 'Inconnu', 'Desconhecido', 'Desconocido', 'Haijulikani', 'غير معروف') },
]

export const LATERALITY: CodedValue<Laterality>[] = [
  { code: 1, key: 'right', labels: L('Right', 'Droite', 'Direita', 'Derecha', 'Kulia', 'يمين') },
  { code: 2, key: 'left', labels: L('Left', 'Gauche', 'Esquerda', 'Izquierda', 'Kushoto', 'يسار') },
  { code: 3, key: 'bilateral', labels: L('Bilateral', 'Bilatéral', 'Bilateral', 'Bilateral', 'Pande zote', 'ثنائي') },
  { code: 4, key: 'na', labels: L('Not applicable', 'Non applicable', 'Não aplicável', 'No aplica', 'Haihusiki', 'لا ينطبق') },
  { code: 9, key: 'unknown', labels: L('Unknown', 'Inconnu', 'Desconhecido', 'Desconocido', 'Haijulikani', 'غير معروف') },
]

export const TREATMENT_TYPE: CodedValue<TreatmentType>[] = [
  { code: 'surgery', key: 'surgery', labels: L('Surgery', 'Chirurgie', 'Cirurgia', 'Cirugía', 'Upasuaji', 'جراحة') },
  { code: 'radiotherapy', key: 'radiotherapy', labels: L('Radiotherapy', 'Radiothérapie', 'Radioterapia', 'Radioterapia', 'Tiba ya mionzi', 'علاج إشعاعي') },
  { code: 'chemotherapy', key: 'chemotherapy', labels: L('Chemotherapy', 'Chimiothérapie', 'Quimioterapia', 'Quimioterapia', 'Tiba ya kemikali', 'علاج كيميائي') },
  { code: 'hormone', key: 'hormone', labels: L('Hormone therapy', 'Hormonothérapie', 'Hormonoterapia', 'Hormonoterapia', 'Tiba ya homoni', 'علاج هرموني') },
  { code: 'immunotherapy', key: 'immunotherapy', labels: L('Immunotherapy', 'Immunothérapie', 'Imunoterapia', 'Inmunoterapia', 'Tiba ya kinga', 'علاج مناعي') },
  { code: 'targeted', key: 'targeted', labels: L('Targeted therapy', 'Thérapie ciblée', 'Terapia-alvo', 'Terapia dirigida', 'Tiba lengwa', 'علاج موجه') },
  { code: 'palliative', key: 'palliative', labels: L('Palliative care', 'Soins palliatifs', 'Cuidados paliativos', 'Cuidados paliativos', 'Tiba shufaa', 'رعاية ملطفة') },
  { code: 'none', key: 'none', labels: L('No treatment', 'Aucun traitement', 'Sem tratamento', 'Sin tratamiento', 'Hakuna matibabu', 'بدون علاج') },
  { code: 'unknown', key: 'unknown', labels: L('Unknown', 'Inconnu', 'Desconhecido', 'Desconocido', 'Haijulikani', 'غير معروف') },
]

export const STAGE_SYSTEM: CodedValue<StageSystem>[] = [
  { code: 'tnm', key: 'tnm', labels: L('UICC TNM', 'UICC TNM', 'UICC TNM', 'UICC TNM', 'UICC TNM', 'TNM') },
  { code: 'essential-tnm', key: 'essential-tnm', labels: L('Essential TNM (IARC)', 'TNM essentiel (IARC)', 'TNM essencial (IARC)', 'TNM esencial (IARC)', 'TNM Muhimu (IARC)', 'TNM الأساسي') },
  { code: 'summary', key: 'summary', labels: L('Summary stage', 'Stade résumé', 'Estádio resumido', 'Estadio resumido', 'Hatua ya muhtasari', 'المرحلة الموجزة') },
]

export const AU_REGIONS: CodedValue<AuRegionKey>[] = [
  { code: 'northern', key: 'northern', labels: L('Northern Africa', 'Afrique du Nord', 'África do Norte', 'África del Norte', 'Afrika Kaskazini', 'شمال أفريقيا') },
  { code: 'western', key: 'western', labels: L('Western Africa', 'Afrique de l’Ouest', 'África Ocidental', 'África Occidental', 'Afrika Magharibi', 'غرب أفريقيا') },
  { code: 'central', key: 'central', labels: L('Central Africa', 'Afrique centrale', 'África Central', 'África Central', 'Afrika ya Kati', 'وسط أفريقيا') },
  { code: 'eastern', key: 'eastern', labels: L('Eastern Africa', 'Afrique de l’Est', 'África Oriental', 'África Oriental', 'Afrika Mashariki', 'شرق أفريقيا') },
  { code: 'southern', key: 'southern', labels: L('Southern Africa', 'Afrique australe', 'África Austral', 'África Austral', 'Afrika Kusini', 'جنوب أفريقيا') },
]

/** Five-year age groups used for aggregation and age-standardised rates. */
export const AGE_GROUPS = [
  '0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39',
  '40-44', '45-49', '50-54', '55-59', '60-64', '65-69', '70-74', '75-79',
  '80-84', '85+',
] as const
export type AgeGroup = (typeof AGE_GROUPS)[number]

export function ageGroupFor(age: number | undefined): AgeGroup | 'unknown' {
  if (age == null || Number.isNaN(age) || age < 0) return 'unknown'
  if (age >= 85) return '85+'
  const idx = Math.floor(age / 5)
  return AGE_GROUPS[idx] ?? 'unknown'
}

/** Look up a translated label for a coded value, falling back to English then the key. */
export function labelFor<T extends string | number>(
  set: CodedValue<T>[],
  code: T,
  lang: string,
): string {
  const v = set.find((x) => x.code === code)
  if (!v) return String(code)
  return v.labels[lang] ?? v.labels.en ?? v.key
}
