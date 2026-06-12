# Architecture

Afya Cancer Registry (ACR) is an **offline-first, hierarchically-federated** cancer surveillance
platform. This document explains the moving parts and the principles that hold them together.

## 1. Design principles

1. **Offline by default.** A registry clerk in a district hospital with no reliable internet must be able
   to register, validate and report cases for days or weeks. The network is treated as an *occasional*
   resource, not a dependency. (Pattern proven by the Community Health Toolkit across rural Africa.)
2. **Data sovereignty & minimisation.** Identifiable patient data never has to leave the facility/registry
   that collected it. Higher tiers of the hierarchy receive **de-identified aggregates**, not records.
   This respects national data-protection law (e.g. the AU Malabo Convention) and keeps sync small enough
   for a weekly upload over a phone tether.
3. **Standards in, standards out.** The internal model maps cleanly to IARC/IACR core variables, ICD-O-3,
   TNM and FHIR/mCODE, so data can move to GLOBOCAN, a national HMIS (DHIS2), a hospital EHR, or a research
   partner without bespoke transformation.
4. **One model, many tiers.** The same data dictionary, validation rules and codebooks run on the clerk's
   tablet and on the continental aggregation server. Behaviour differs only in *what each tier is allowed
   to see*, governed by role + position in the hierarchy.
5. **Multilingual & equitable.** Every screen works in all six AU working languages, including right-to-left
   Arabic. Comparisons against LMIC and global benchmarks are framed to avoid implying African registries
   are deficient — differences in coverage and quality are surfaced explicitly, not hidden.

## 2. The hierarchy

```
 Tier 6  Continental (Africa-wide)        ─┐
 Tier 5  AU Region (Northern, Western,     │  aggregate-only
         Central, Eastern, Southern)       │  (de-identified counts
 Tier 4  Country                           │   + quality indicators)
 Tier 3  Sub-national region (province)   ─┘
 ───────────────────────────────────────────────────────────────
 Tier 2  Registry / Centre  (PBCR or HBCR) ─┐  case-level
 Tier 1  Facility / Hospital / Path lab     ┘  (identifiable, local)
```

- **Tiers 1–2** hold and synchronise **case-level** records (with PHI) inside a trust boundary — typically
  one CouchDB per registry, replicated to the facility devices that are authorised for it.
- **Tiers 3–6** hold and synchronise **aggregate documents** only: counts by site × sex × age-group × year
  × basis × stage, plus the IARC quality indicators. No PHI crosses the Tier-2 → Tier-3 boundary.
- A **Global / LMIC comparison** layer sits beside the tree as reference data (GLOBOCAN-style benchmarks),
  used by dashboards for context.

See [`ACCESS-CONTROL.md`](ACCESS-CONTROL.md) for the role model and [`SYNC.md`](SYNC.md) for how data moves.

## 3. Components

```
┌─────────────────────────────────────────────────────────────────────┐
│  apps/web  —  Offline-first PWA (tablet or desktop, installable)     │
│                                                                     │
│   UI (React, 6 languages, RTL)                                      │
│     ├─ Case entry  ├─ Case list  ├─ Dashboards  ├─ Settings/Sync    │
│   Session/RBAC context  (role + hierarchy node → visible scope)     │
│   ─────────────────────────────────────────────────────────────    │
│   src/core  — the standards engine (framework-agnostic TypeScript)  │
│     ├─ types & value sets   (IARC/IACR core variables)              │
│     ├─ reference/icdo3      (topography, morphology, behaviour)     │
│     ├─ reference/geography  (AU regions, countries, subnationals)   │
│     ├─ validation           (CanReg5-style consistency checks)      │
│     ├─ hierarchy & rbac     (the federated tree + permissions)      │
│     ├─ aggregate & quality  (incidence, ASR, MV%/DCO%/MI ratio)     │
│     ├─ fhir (R4 + mCODE)    (export/import bundles)                 │
│     └─ dhis2                (aggregate dataValueSet export)         │
│   ─────────────────────────────────────────────────────────────    │
│   PouchDB (IndexedDB)  ←→  Service Worker (app shell cache)         │
└───────────────────────────────┬─────────────────────────────────────┘
              filtered replication │ (continuous when online,
                                   │  scheduled daily/weekly otherwise)
┌───────────────────────────────▼─────────────────────────────────────┐
│  Registry server  —  CouchDB (case-level, per registry trust zone)  │
│  apps/sync-gateway —  Node service:                                 │
│     ├─ authenticates devices, scopes replication to the user's node │
│     ├─ rolls up case-level data → de-identified aggregate documents │
│     ├─ pushes aggregates up-tier (region → country → continental)   │
│     ├─ exposes FHIR & DHIS2 endpoints for interoperability          │
│     └─ couch2pg-style stream → Postgres for heavy analytics         │
└─────────────────────────────────────────────────────────────────────┘
```

The PWA is the heart of the system and runs **standalone** with seed data — you do not need the gateway or
a CouchDB server to evaluate it. The gateway is what turns a set of standalone installs into a synchronised
federation.

## 4. Why these technologies

| Choice | Reason |
| --- | --- |
| **PWA (installable)** | One codebase installs on Android tablets, Windows/Mac/Linux desktops and runs offline from the device. No app-store gatekeeping; updates pushed when online. |
| **PouchDB ↔ CouchDB** | Battle-tested bidirectional, conflict-aware replication that tolerates weeks offline and bad networks — the exact problem African deployments hit. Filtered replication gives per-node data scoping for free. |
| **TypeScript core, framework-free** | The clinical logic (validation, coding, FHIR) is reused by the app, the gateway and future Electron/CLI/mobile front-ends without rewrites. |
| **De-identified aggregate roll-up** | Keeps PHI local, shrinks uploads to kilobytes, and matches how IARC/AFCRN already exchange data (counts, not patients). |
| **FHIR R4 + mCODE** | The current international consensus for moving oncology data between systems; lets ACR talk to EHRs and research networks. |
| **Lightweight hand-rendered charts** | Dashboards render from local data with zero external chart dependency, so they work fully offline and load instantly on low-end tablets. |

## 5. Data flow of a single case

1. **Capture** — clerk enters a case on the tablet; the form is driven by the data dictionary and value
   sets, with field-level help in the user's language.
2. **Validate** — the validation engine runs CanReg5-style consistency checks live (site/histology,
   behaviour/site, sex/site, basis/morphology, date order). Errors block, warnings flag.
3. **Store** — the record is written to PouchDB locally with a `status` (`draft` → `complete` →
   `verified`) and full audit metadata.
4. **Sync (case-level)** — when connectivity allows (continuous, or the configured daily/weekly window),
   the record replicates to the registry's CouchDB, scoped to the clerk's facility.
5. **Roll-up** — the gateway aggregates verified records into de-identified count documents and computes
   quality indicators.
6. **Federate (aggregate)** — aggregate documents replicate up-tier. A national focal point sees their
   country; a regional coordinator sees their AU region; the continental dashboard sees all of Africa, each
   with LMIC/global comparison.
7. **Interoperate** — on demand, any case (with permission) exports as a FHIR/mCODE bundle; any aggregate
   exports as a DHIS2 `dataValueSet` or IARC submission file.

## 6. Deployment topologies

- **Single registry, standalone** — one or more tablets running the PWA, one registry CouchDB + gateway on
  a local server or a low-cost VM. Optional weekly upload of aggregates to a national server.
- **National programme** — registries sync case-level data within their own trust zone; a national gateway
  collects aggregates and exposes a DHIS2 feed to the Ministry of Health HMIS.
- **Continental** — AFCRN/IARC-style hub receives aggregate documents from national gateways for
  pan-African dashboards and GLOBOCAN-style estimation.

All three run the same code; only configuration and the sync topology differ.
