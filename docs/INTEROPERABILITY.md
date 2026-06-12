# Interoperability

ACR is built to **exchange**, not silo. Three concrete integration surfaces are implemented in
[`apps/web/src/core/fhir.ts`](../apps/web/src/core/fhir.ts) and
[`apps/web/src/core/dhis2.ts`](../apps/web/src/core/dhis2.ts), and exposed by the gateway.

## 1. HL7 FHIR R4 + mCODE (clinical exchange)

A case record maps to a FHIR `Bundle` whose entries follow the **mCODE** profiles:

| ACR concept | FHIR resource (mCODE profile) | Key bindings |
| --- | --- | --- |
| Patient | `Patient` (mCODE **CancerPatient**) | `gender`, `birthDate` (year-precision in synced data) |
| Primary tumour | `Condition` (mCODE **PrimaryCancerCondition**) | `code` = ICD-O-3 morphology + ICD-10/11; `bodySite` = ICD-O-3 topography |
| Histology / behaviour | `Observation` (**HistologyMorphologyBehavior**) | ICD-O-3 morphology+behaviour |
| Stage | `Observation` (**TNMStageGroup** / Essential TNM) | TNM value or summary stage |
| Treatment — surgery | `Procedure` (**CancerRelatedSurgicalProcedure**) | |
| Treatment — radiotherapy | `Procedure` (**CancerRelatedRadiationProcedure**) | |
| Treatment — systemic | `MedicationStatement` (**CancerRelatedMedicationStatement**) | chemo/hormone/targeted/immuno |
| Disease status / outcome | `Observation` (**CancerDiseaseStatus**) | |
| Vital status | `Patient.deceased` / `Observation` | |

`toFhirBundle(caseRecord)` produces this bundle; `fromFhirBundle(bundle)` ingests an EHR's mCODE export
back into the ACR model, so a cancer centre's EHR can feed the registry without re-keying.

## 2. DHIS2 (national HMIS aggregate integration)

`toDhis2DataValueSet(aggregates, mapping)` converts ACR aggregate documents into a DHIS2 `dataValueSet`
payload, mapping `(topographyGroup, sex, ageGroup)` to DHIS2 `dataElement` + `categoryOptionCombo` and the
hierarchy node to a DHIS2 `orgUnit`. This lets a Ministry of Health pull cancer-incidence aggregates into
its national dashboard without exposing any patient record.

## 3. IARC / IACR submission (GLOBOCAN / CI5)

`toIarcSubmission(cases)` emits the flat case file IARC expects (topography, morphology, behaviour, basis
of diagnosis, incidence date, sex, age, …) for contribution to CI5 / GLOBOCAN, the same data flow AFCRN
member registries already use.

## 4. Coding interoperability

- **ICD-O-3 ↔ ICD-10 ↔ ICD-11** crosswalks live in `reference/` (illustrative subset shipped; full maps
  loaded at deploy). ICD-11's oncology dimension is a forward target.
- All coded value sets carry stable keys so mappings to SNOMED CT / LOINC can be layered on for deployments
  licensed for those terminologies.

## 5. Standards-based APIs (gateway)

The sync-gateway exposes:

- `GET /fhir/Bundle/:caseId` — a case as an mCODE bundle (authorised callers only).
- `POST /fhir/$ingest` — accept an mCODE bundle from an EHR.
- `GET /dhis2/dataValueSet?country=KE&year=2023` — aggregate export.
- `GET /export/iarc?registry=…&year=…` — IARC submission file.
- `GET /aggregates?scope=…` — the de-identified count cube for dashboards up-tier.

All endpoints honour the same role + hierarchy scoping as the app, and never return case-level PHI above
Tier 2.

## 6. OpenHIE alignment

ACR plays the **Point-of-Service** and **registry** roles in an OpenHIE topology: facilities/registries are
points of service; the gateway can register with a national **Health Information Exchange** and a
**Facility Registry / Client Registry** so identifiers reconcile across systems.
