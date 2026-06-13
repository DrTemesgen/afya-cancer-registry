/**
 * Childhood-cancer classification value sets.
 *
 * ICCC-3 — International Classification of Childhood Cancer, 3rd edition: the 12
 * main diagnostic groups that childhood malignancies are grouped into (by
 * morphology rather than site, unlike adult registration). Steliarova-Foucher
 * E. et al., "International Classification of Childhood Cancer, third edition",
 * Cancer 2005;103(7):1457-67. See https://seer.cancer.gov/iccc/.
 *
 * Toronto — the childhood cancers covered by the Toronto Paediatric Cancer
 * Stage Guidelines (UICC-endorsed two-tier staging for population registries).
 * Gupta S. et al., Lancet Oncol 2016;17(4):e163-72.
 *
 * Labels carry English text; other AU languages fall back to English until
 * translated. Codes are stable, language-neutral keys.
 */
import type { CodedValue } from '../types'

/** ICCC-3 main diagnostic groups (I–XII), keyed by Roman numeral. */
export const ICCC3_GROUPS: CodedValue<string>[] = [
  { code: 'I', key: 'leukaemia', labels: { en: 'I — Leukaemias, myeloproliferative & myelodysplastic diseases' } },
  { code: 'II', key: 'lymphoma', labels: { en: 'II — Lymphomas & reticuloendothelial neoplasms' } },
  { code: 'III', key: 'cns', labels: { en: 'III — CNS & miscellaneous intracranial/intraspinal neoplasms' } },
  { code: 'IV', key: 'neuroblastoma', labels: { en: 'IV — Neuroblastoma & other peripheral nervous cell tumours' } },
  { code: 'V', key: 'retinoblastoma', labels: { en: 'V — Retinoblastoma' } },
  { code: 'VI', key: 'renal', labels: { en: 'VI — Renal tumours' } },
  { code: 'VII', key: 'hepatic', labels: { en: 'VII — Hepatic tumours' } },
  { code: 'VIII', key: 'bone', labels: { en: 'VIII — Malignant bone tumours' } },
  { code: 'IX', key: 'soft-tissue', labels: { en: 'IX — Soft tissue & other extraosseous sarcomas' } },
  { code: 'X', key: 'germ-cell', labels: { en: 'X — Germ cell, trophoblastic tumours & neoplasms of gonads' } },
  { code: 'XI', key: 'epithelial', labels: { en: 'XI — Other malignant epithelial neoplasms & malignant melanomas' } },
  { code: 'XII', key: 'other', labels: { en: 'XII — Other & unspecified malignant neoplasms' } },
]

/** Childhood cancers staged by the Toronto Paediatric Cancer Stage Guidelines. */
export const TORONTO_STAGED: CodedValue<string>[] = [
  { code: 'all', key: 'all', labels: { en: 'Acute lymphoblastic leukaemia' } },
  { code: 'aml', key: 'aml', labels: { en: 'Acute myeloid leukaemia' } },
  { code: 'hodgkin', key: 'hodgkin', labels: { en: 'Hodgkin lymphoma' } },
  { code: 'nhl', key: 'nhl', labels: { en: 'Non-Hodgkin lymphoma' } },
  { code: 'astrocytoma', key: 'astrocytoma', labels: { en: 'Astrocytoma' } },
  { code: 'medulloblastoma', key: 'medulloblastoma', labels: { en: 'Medulloblastoma & other CNS embryonal tumours' } },
  { code: 'ependymoma', key: 'ependymoma', labels: { en: 'Ependymoma' } },
  { code: 'neuroblastoma', key: 'neuroblastoma', labels: { en: 'Neuroblastoma' } },
  { code: 'retinoblastoma', key: 'retinoblastoma', labels: { en: 'Retinoblastoma' } },
  { code: 'wilms', key: 'wilms', labels: { en: 'Renal tumours (e.g. Wilms), excl. renal cell carcinoma' } },
  { code: 'hepatoblastoma', key: 'hepatoblastoma', labels: { en: 'Hepatoblastoma' } },
  { code: 'bone', key: 'bone', labels: { en: 'Malignant bone tumours' } },
  { code: 'rms', key: 'rms', labels: { en: 'Rhabdomyosarcoma' } },
  { code: 'nrsts', key: 'nrsts', labels: { en: 'Non-rhabdomyosarcoma soft-tissue sarcoma' } },
  { code: 'ovarian-gct', key: 'ovarian-gct', labels: { en: 'Ovarian germ cell tumours' } },
  { code: 'testicular-gct', key: 'testicular-gct', labels: { en: 'Testicular germ cell tumours' } },
]
