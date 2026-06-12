# Afya Cancer Registry (ACR)

> An open-source, offline-first, multilingual **African Cancer Registry platform** for cancer-treating
> centres, hospital-based and population-based registries across the African Union — from a single
> hospital up to continental aggregation — built on international cancer-registration and health-data
> interoperability standards.

### 🌍 Live demo — **<https://afya-cancer-registry.vercel.app>**

Source code: <https://github.com/DrTemesgen/afya-cancer-registry>

The live demo is the installable PWA loaded with synthetic seed data. Sign in as any demo user
(e.g. *Joseph — Kenya MoH* for national dashboards, or *Aisha — Nairobi clerk* for case entry),
switch between the six African Union languages, and explore the hierarchy, validation, dashboards and
FHIR/DHIS2 exports. **No real patient data is included.**

**Afya** means *health* in Kiswahili, an African Union working language.

---

## What this is

A platform to **record, validate, analyse and share cancer data** at every level of the African health
system, while keeping patient data under local control:

```
Facility / Hospital  →  Registry / Centre  →  Sub-national region  →  Country
        →  AU Region (5)  →  Continental (Africa-wide)  →  Global / LMIC comparison
```

Each level sees what its role and position in the hierarchy permit. Personally identifiable data stays
at the facility/registry where it was collected; only **de-identified aggregates** flow upward to
regional, national and continental dashboards. The whole system runs **offline on a tablet or computer**
and **synchronises daily or weekly** (or continuously when a network is available).

## Why it is built the way it is

The design is grounded in the established global cancer-registration and digital-health ecosystem rather
than inventing a new one. See [`docs/STANDARDS.md`](docs/STANDARDS.md) for the full mapping. In short:

| Concern | Standard / system we align to |
| --- | --- |
| Registry data model & quality checks | **IARC CanReg5**, **IARC/IACR** core variables, **ENCR** recommendations |
| African network & procedures | **AFCRN** Standard Procedure Manual, **GICR** (IARC) |
| Disease coding | **ICD-O-3.2** (topography, morphology, behaviour, grade), **ICD-10 / ICD-11** |
| Staging | **UICC TNM**, IARC **Essential TNM**, summary stage |
| Clinical interoperability | **HL7 FHIR R4** + **mCODE** (minimal Common Oncology Data Elements) |
| National HMIS integration | **DHIS2** aggregate `dataValueSet` export, **OpenHIE** architecture |
| Offline-first sync | **CouchDB / PouchDB** partial replication (the **Community Health Toolkit** pattern) |
| Quality indicators | IARC comparability & quality metrics (MV%, DCO%, M/I ratio, O/E) |
| Languages | **African Union** working languages: Arabic, English, French, Portuguese, Spanish, Kiswahili |

## Repository layout

```
.
├── README.md                  ← you are here
├── LICENSE                    ← Apache-2.0
├── docs/                      ← architecture & standards (read these first)
│   ├── ARCHITECTURE.md
│   ├── STANDARDS.md
│   ├── DATA-DICTIONARY.md
│   ├── ACCESS-CONTROL.md
│   ├── SYNC.md
│   ├── INTEROPERABILITY.md
│   ├── LOCALIZATION.md
│   ├── SECURITY-PRIVACY.md
│   ├── CONTINENTAL-ALIGNMENT.md   ← IACR/CI5 adoption + fitness for continental adoption
│   ├── GOVERNANCE.md
│   └── ROADMAP.md
├── apps/
│   ├── web/                   ← offline-first PWA (React + TypeScript + PouchDB)
│   │   └── src/core/          ← the standards engine: data model, validation, FHIR, aggregation
│   └── sync-gateway/          ← Node sync & aggregate-roll-up service
└── data/seed/                 ← African geography, sample registries, reference code subsets
```

## Quick start

Requires **Node.js ≥ 18** (built and tested on Node 25).

```bash
# install all workspaces
npm install

# run the offline-first registry app (opens on http://localhost:5173)
npm run dev

# run the sync / aggregate gateway (http://localhost:4000)
npm run dev:gateway
```

The app ships with seed data (African regions, countries, sample registries and synthetic cases) so the
dashboards, validation, role hierarchy, language switching and FHIR export are all immediately explorable.
**No real patient data is included.**

## Status

This repository is a **standards-grounded, runnable foundation**, not a finished national system. It
implements the core architecture end-to-end (data model + ICD-O-3 validation + offline storage + RBAC
hierarchy + 6-language UI + dashboards + FHIR/mCODE & DHIS2 export + sync model) so that registries,
ministries and implementers can evaluate, extend and deploy it. The path from here to production is in
[`docs/ROADMAP.md`](docs/ROADMAP.md).

## Licence

[Apache-2.0](LICENSE) — free to use, modify and deploy, including by national programmes and NGOs.
Cancer-registration reference materials (ICD-O-3, ICD-11, TNM) remain the property of their respective
publishers (WHO/IARC, UICC); this project ships only small illustrative subsets and integrates the full
code lists at deployment time under their own terms.
