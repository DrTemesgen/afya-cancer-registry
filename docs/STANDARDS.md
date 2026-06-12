# Standards & prior art

ACR deliberately stands on the shoulders of the global cancer-registration and digital-health community.
This document records **what we surveyed**, **what we adopt**, and **how each standard maps into the
platform**. Implementers should treat the upstream specifications as authoritative; ACR ships small
illustrative subsets and integrates the full code lists at deployment under their own licences.

## 1. Cancer-registration software & networks surveyed

| Project | What it is | What ACR takes from it |
| --- | --- | --- |
| **CanReg5** (IARC/IACR, open source) | The de-facto open-source tool for population-based cancer registries: data entry, multi-user, customisable variables, multiple sources, and **consistency/quality checks** against ICD-O-3. Available in Chinese, English, French, Portuguese, Russian, Spanish. | The validation philosophy and the specific consistency checks (age/site/histology, site/histology, behaviour/site, behaviour/histology, basis-of-diagnosis/histology). ACR re-implements these as a portable rule engine. |
| **IARC / IACR** (Int'l Agency for Research on Cancer / Int'l Association of Cancer Registries) | Custodians of cancer-registration methodology, ICD-O, multiple-primary rules, and the core variable set submitted to GLOBOCAN/CI5. | The **core variable list** and incidence-date priority rules that define our data dictionary. |
| **AFCRN** (African Cancer Registry Network) | IARC's sub-Saharan Africa regional hub (founded 2012); ~35 member registries in 25 countries; publishes the **Standard Procedure Manual** for PBCRs in SSA (EN/FR). | The African operating context, SOP-driven workflow, and the regional/continental aggregation model. |
| **GICR** (Global Initiative for Cancer Registry Development) | IARC programme strengthening registries in LMICs through regional hubs. | The LMIC-comparison framing and capacity-building orientation. |
| **ENCR** (European Network of Cancer Registries) | Recommendations on coding, multiple primaries, and data quality widely used beyond Europe. | Cross-checked our value sets and quality indicators. |
| **NAACCR** | North American standard for registry data exchange and ICD-O-3 implementation. | Reference for data-exchange field semantics. |
| **Community Health Toolkit / Medic** | Open-source, **offline-first** CHW platform on CouchDB/PouchDB, widely deployed in Africa, with DHIS2 export. | The **sync architecture** (partial/filtered replication, scheduled sync, DHIS2 roll-up). |
| **DHIS2** | The dominant national HMIS/aggregate platform across African ministries of health. | The **aggregate export target** (`dataValueSet`) for national integration. |
| **OpenHIE / OpenMRS** | Reference architecture and EMR for LMIC health information exchange. | The interoperability layering (point-of-service ↔ shared registries ↔ HIE). |

## 2. Classifications & terminologies

| Standard | Use in ACR |
| --- | --- |
| **ICD-O-3.2** (Int'l Classification of Diseases for Oncology) | Primary coding of **topography** (C00–C80), **morphology** (8000–9993), **behaviour** (/0 /1 /2 /3 /6), and **grade/differentiation**. Drives the consistency checks. |
| **ICD-10 / ICD-11** | Diagnosis coding and ICD-O→ICD mapping for HMIS and mortality. ICD-11 has a built-in oncology dimension that ACR can target as adoption grows. |
| **UICC TNM** (8th ed.) | Clinical/pathological stage. |
| **IARC Essential TNM** | A simplified, registry-friendly staging scheme designed for LMIC settings where full TNM is often unavailable — ACR supports it as a first-class staging system. |
| **Summary stage** (localised / regional / distant) | Fallback stage when neither TNM nor Essential TNM is recorded. |
| **SNOMED CT, LOINC** | Optional fine-grained clinical/lab coding where a deployment is licensed for them (FHIR/mCODE bindings). |
| **ISO 3166** | Country codes; combined with AU-region grouping. |

## 3. Interoperability standards

| Standard | Use in ACR |
| --- | --- |
| **HL7 FHIR R4** | The wire format for clinical data exchange. ACR maps a case to a FHIR `Bundle`. |
| **mCODE v4 (HL7)** | The oncology profile set on FHIR (~90 elements across patient, disease, staging, genomics, treatment, outcome). ACR's FHIR export targets the mCODE profiles (`CancerPatient`, `PrimaryCancerCondition`, `TNMStageGroup`, `CancerRelatedSurgical/Medication/RadiationProcedure`, `CancerDiseaseStatus`). |
| **DHIS2 ADX / dataValueSet** | Aggregate export for national HMIS dashboards. |
| **IARC/IACR submission format** | Flat case file for CI5/GLOBOCAN contributions (topography, morphology, behaviour, basis, incidence date, …). |

See [`INTEROPERABILITY.md`](INTEROPERABILITY.md) for concrete field mappings.

## 4. Quality & comparability indicators (IARC)

ACR computes the standard registry quality indicators so a registry can self-assess and so cross-registry
comparison is meaningful:

- **MV%** — proportion of cases morphologically (microscopically) verified.
- **DCO%** — proportion of cases known only from a death certificate.
- **M/I ratio** — mortality-to-incidence ratio (a completeness signal).
- **O/E** — observed-to-expected ratio against a reference.
- **% unknown** for key variables (age, sex, basis, stage).
- **Age-standardised incidence rate (ASR)** using the Segi/World standard population.

These appear on every dashboard so that comparisons with LMIC/global benchmarks are read **with their
quality caveats visible**, never as bare league tables.

## 5. Languages

The African Union working languages — **Arabic, English, French, Portuguese, Spanish, Kiswahili** — are all
first-class UI languages, with right-to-left layout for Arabic. The architecture allows adding any other
African language by dropping in a locale file. See [`LOCALIZATION.md`](LOCALIZATION.md).

## 6. Privacy & legal context

- **AU Malabo Convention** on Cyber Security and Personal Data Protection, and national data-protection
  acts, motivate the data-minimisation design (PHI stays local; only aggregates federate).
- The **McCabe Centre / IARC / AFCRN** legal toolkit on mandatory cancer notification informs the
  consent/notification model deployments will configure.

See [`SECURITY-PRIVACY.md`](SECURITY-PRIVACY.md).

## Sources

- IARC/IACR CanReg5 — https://www.iacr.com.fr/ and https://github.com/IARC-CSU/CanReg5
- Planning & Developing PBCR in Low/Middle-Income Settings (IARC) — https://www.ncbi.nlm.nih.gov/books/NBK566958/
- African Cancer Registry Network — https://afcrn.org/ (Standard Procedure Manual)
- Global Initiative for Cancer Registry Development — https://gicr.iarc.who.int/
- mCODE Implementation Guide (HL7) — https://www.hl7.org/fhir/us/mcode/
- Community Health Toolkit — https://docs.communityhealthtoolkit.org/
- DHIS2 — https://dhis2.org/
- African Union languages — https://au.int/en/about/languages
