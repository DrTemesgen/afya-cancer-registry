# Data dictionary

The ACR case record is built from the **IARC/IACR core variables** every population-based registry is
expected to collect, plus optional hospital-based and treatment/outcome extensions that align with mCODE.
The canonical definitions live in code at [`apps/web/src/core/types.ts`](../apps/web/src/core/types.ts)
and the coded value sets at [`apps/web/src/core/valuesets.ts`](../apps/web/src/core/valuesets.ts). This
document is the human-readable companion.

Legend: **C** = IARC core (required for PBCR), **R** = recommended, **O** = optional/extension.

## 1. Patient

| Field | Tier | Type / value set | Notes |
| --- | --- | --- | --- |
| `patientId` | C | string | Registry-assigned pseudonymous ID. Never a national ID in the synced record. |
| `sex` | C | `Sex` (1 male, 2 female, 3 other, 9 unknown) | IARC coding. |
| `dateOfBirth` | C | partial date | Day/month may be unknown; year required where possible. |
| `ageAtIncidence` | C | integer (years) | Derived from DOB + incidence date, or entered if DOB unknown. |
| `birthplace` | O | ISO-3166 / free | |
| `residenceAreaCode` | C | hierarchy node id | Links the patient to a sub-national region (denominators / ASR). |
| `urbanRural` | R | `1 urban / 2 rural / 9 unknown` | |
| `vitalStatus` | R | `1 alive / 2 dead / 9 unknown` | |
| `dateOfLastContact` | R | partial date | Drives survival follow-up. |
| `dateOfDeath` | R | partial date | |
| `causeOfDeath` | O | ICD-10 | |

## 2. Tumour (the unit of incidence)

A patient may have multiple primary tumours; each is a separate tumour record linked to the patient
(IARC multiple-primary rules).

| Field | Tier | Type / value set | Notes |
| --- | --- | --- | --- |
| `tumourId` | C | string | |
| `incidenceDate` | C | partial date | **Date of incidence** per IARC priority order (see §4). |
| `topographyIcdO3` | C | ICD-O-3 topography `C00–C80` | Site of the primary. |
| `morphologyIcdO3` | C | ICD-O-3 morphology `8000–9993` | Histological type. |
| `behaviour` | C | `Behaviour` (/0 benign, /1 uncertain, /2 in situ, /3 malignant, /6 metastatic) | ICD-O-3 behaviour code. |
| `grade` | R | `Grade` (1–4, 9 unknown; plus lineage codes 5–8) | Differentiation / lineage. |
| `laterality` | R | `1 right / 2 left / 3 bilateral / 9 NA` | For paired organs. |
| `basisOfDiagnosis` | C | `BasisOfDiagnosis` (0 DCO … 7 histology of primary … 9 unknown) | Certainty of diagnosis; central to quality (MV%, DCO%). |
| `stageSystem` | R | `tnm / essential-tnm / summary` | Which staging scheme was used. |
| `stageValue` | R | string | e.g. `T2N1M0`, `II`, `regional`. |
| `mostValidBasis` | R | derived | Highest basis among sources. |
| `multiplePrimarySeq` | R | integer | Sequence among the patient's primaries. |
| `sources` | R | array of source records | Pathology lab, hospital ward, death registry, etc. |

## 3. Treatment & outcome (hospital-based / mCODE extension)

PBCRs typically stop at incidence; hospital-based registries and cancer-centre deployments collect these.

| Field | Tier | Type / value set | Notes |
| --- | --- | --- | --- |
| `treatments[]` | O | `TreatmentType` (surgery, radiotherapy, chemotherapy, hormone, immunotherapy, targeted, palliative, none, unknown) + date | Maps to mCODE procedures/medications. |
| `firstCourseIntent` | O | `curative / palliative / unknown` | |
| `diseaseStatus` | O | mCODE `CancerDiseaseStatus` | |
| `survivalMonths` | O | derived | From incidence → last contact/death. |

## 4. Date of incidence — IARC priority order

When several candidate dates exist, choose the **earliest** of the higher-priority events; if a
higher-priority event occurs within **3 months** of the chosen date, it takes precedence:

1. Date of first histological/cytological confirmation of cancer.
2. Date of admission to the hospital/clinic where the diagnosis was made.
3. Date of first consultation for the cancer.
4. Date of diagnosis other than the above.
5. Date of death (DCO) — only if nothing else is known.

The data-entry form encodes this so clerks pick consistently.

## 5. Administrative & audit (every record)

| Field | Notes |
| --- | --- |
| `facilityNodeId`, `registryNodeId`, `countryNodeId`, `regionNodeId` | Position in the hierarchy at capture time. |
| `status` | `draft → complete → verified` workflow. |
| `createdBy`, `createdAt`, `updatedBy`, `updatedAt` | Audit trail. |
| `qcFlags[]` | Validation findings attached at save time. |
| `_id`, `_rev` | PouchDB/CouchDB document identity & revision (sync). |

## 6. Value sets

All coded fields draw from explicit value sets in `valuesets.ts`, each with a code, a stable key and
translated display labels for the six AU languages. Reference classifications (ICD-O-3, ICD-10/11, TNM)
are loaded from `reference/` — the repo ships **illustrative subsets**; production loads the full,
licensed code lists from IARC/WHO/UICC.
