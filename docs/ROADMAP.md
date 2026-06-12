# Roadmap

This repository is a **standards-grounded, runnable foundation**. It implements the full architecture
end-to-end so the design can be evaluated and extended, but it is not yet a production national system.
Here is an honest account of what exists and what comes next.

## Implemented in this foundation

- [x] Monorepo, Apache-2.0, full architecture & standards documentation.
- [x] **Clinical core** (`apps/web/src/core`): IARC/IACR-aligned data model & value sets.
- [x] **ICD-O-3 reference subset** (topography, morphology, behaviour, grade) + crosswalk stubs.
- [x] **Validation engine** with CanReg5-style consistency checks (site/histology, behaviour/site,
      sex/site, basis/morphology, date order, age plausibility).
- [x] **Hierarchy & RBAC** (6-tier tree, roles × node scope, PHI boundary).
- [x] **Offline storage** via PouchDB; sync configuration (continuous / daily / weekly / manual).
- [x] **Aggregation & IARC quality indicators** (incidence counts, ASR, MV%, DCO%, M/I ratio).
- [x] **Dashboards** with hierarchy drill-down and LMIC/global comparison.
- [x] **FHIR R4 + mCODE** export/import, **DHIS2** aggregate export, **IARC submission** export.
- [x] **6 AU languages** incl. Arabic RTL.
- [x] **Sync gateway** service (health, roll-up, aggregate & interoperability endpoints).
- [x] **Seed data**: AU regions, sample countries/registries/facilities, synthetic cases.

## Next — Phase 1: hardening the registry node (single-registry production)

- [ ] Load the **full ICD-O-3.2, ICD-10/11 and TNM** code lists (licensed) with multilingual display terms.
- [ ] Complete the CanReg5 consistency-check matrix (the full IARC site×histology validity tables).
- [ ] User accounts, authentication, per-user credentials, session management on the gateway.
- [ ] Stand up **CouchDB** with filtered replication + the conflict-review queue in the UI.
- [ ] Local-only identity store (names/IDs) separated from the synced record; de-duplication & record
      linkage across sources.
- [ ] Data-entry ergonomics: multi-source merge, partial-date handling, keyboard-first workflows, scanning.
- [ ] Print/exports: registry abstract, follow-up letters, IARC submission validation.

## Phase 2: federation & national integration

- [ ] Gateway up-tier replication with small-cell suppression and disclosure-control policy engine.
- [ ] DHIS2 live integration (org-unit + data-element mapping UI).
- [ ] National focal-point dashboards; cross-registry coverage & completeness reporting.
- [ ] Survival analysis module (active follow-up, life-table/relative survival).

## Phase 3: continental & research

- [ ] AU-region and continental aggregation hubs; GLOBOCAN-style estimation support.
- [ ] Researcher portal with approved de-identified extracts, k-anonymity tooling, audit.
- [ ] ICD-11 oncology dimension as a primary coding target.
- [ ] Paediatric (ICCC) and rare-cancer modules; childhood-cancer recode.

## Phase 4: scale & ecosystem

- [ ] Electron/native packaging for fully offline desktop installs; signed updates.
- [ ] Pluggable terminology service (SNOMED CT/LOINC for licensed deployments).
- [ ] Additional African languages (Amharic, Hausa, Yoruba, isiZulu, …).
- [ ] Conformance test suite against IARC/IACR data-quality criteria and mCODE profiles.

## Explicitly out of scope (for now)

- Diagnosis or treatment decision support — ACR is a **registry/surveillance** system, not a clinical
  decision tool.
- Storing un-pseudonymised national IDs in the synced/federated layer.
