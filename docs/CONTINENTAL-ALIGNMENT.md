# Continental alignment — IACR adoption & fitness for continental adoption

Two questions this document answers:

1. **What does ACR adopt from the IACR** (International Association of Cancer Registries) and its
   tooling (CI5, the registry directory, Tools & Standards)?
2. **How is ACR built to be *implementable and acceptable* for the goals of a continental public-health
   body** (e.g. strengthening Africa-wide disease surveillance), without being tied to or branded by any
   single institution?

> ACR is an independent open-source platform. It is *designed to be adoptable* by national programmes,
> registry networks and continental coordinating bodies — alignment, not endorsement.

## 1. What we adopt from IACR / IARC

| IACR asset | What it is | How ACR adopts it |
| --- | --- | --- |
| **Core variables** (IACR/IARC) | The standard data items every population-based registry collects. | ACR's data model & data dictionary are built on them. See [`DATA-DICTIONARY.md`](DATA-DICTIONARY.md). |
| **CanReg5 consistency checks** | The validity rules (site/histology, behaviour/site, sex/site, basis/morphology…). | Re-implemented as a portable rule engine. See [`STANDARDS.md`](STANDARDS.md). |
| **CI5 — Cancer Incidence in Five Continents** | The reference compilation; its viewer shows **age-specific case numbers and rates by cancer site**. | ACR ships a **CI5-style cross-tabulation** (site × five-year age group, with totals and a sex toggle) on every dashboard — `apps/web/src/components/AgeSiteTable.tsx`. |
| **Registry Directory** | A directory of registries with location, type and contacts. | ACR's hierarchy *is* a living directory: the **Registries** view lists every registry with its type (population/hospital-based), country, AU region, population and case volume. Contact fields are a straightforward extension. |
| **Tools & Standards** (ICD-O-3, ICD-11, TNM, data exchange) | The classification and exchange standards IACR curates. | Adopted as ACR's coding and interoperability layer (ICD-O-3 coding, TNM/Essential TNM staging, IACR submission export for CI5/GLOBOCAN). See [`INTEROPERABILITY.md`](INTEROPERABILITY.md). |
| **Quality / comparability criteria** | MV%, DCO%, M/I ratio, completeness — IACR's yardsticks for usable registry data. | Computed and surfaced on every dashboard so comparisons carry their quality caveats. See [`STANDARDS.md`](STANDARDS.md) §4. |
| **GLOBOCAN / CI5 contribution flow** | Registries submit standardised case files upward. | ACR exports the IARC submission file directly (`core/iarc.ts`). |

**Net effect:** a registry running ACR produces data that already speaks IACR's language — same variables,
same checks, same tabulations, same submission format — so it can join CI5/GLOBOCAN and the IACR registry
directory with minimal friction.

## 2. Built to be adoptable at continental scale

A continental coordinating body needs a system that strengthens surveillance *across sovereign member
states* without centralising their patient data, runs in low-resource settings, and speaks the standards
the ministries already use. ACR is designed against exactly those constraints:

| Continental requirement | How ACR meets it |
| --- | --- |
| **Continental surveillance & aggregation** | The 6-tier federation rolls de-identified aggregates Facility → Registry → Sub-national → Country → AU Region → Continental, with comparison against LMIC/global benchmarks. See [`ARCHITECTURE.md`](ARCHITECTURE.md). |
| **Data sovereignty** | Identifiable data **never leaves** the registry/country; only non-identifying count cubes federate upward — aligned with the **AU Malabo Convention** and national data-protection law. See [`SECURITY-PRIVACY.md`](SECURITY-PRIVACY.md). |
| **Interoperability with national systems** | **DHIS2** aggregate export (the HMIS most African ministries run), **HL7 FHIR + mCODE** for EHR exchange, **OpenHIE** roles — so cancer data flows into existing **Integrated Disease Surveillance & Response (IDSR)** and national dashboards. See [`INTEROPERABILITY.md`](INTEROPERABILITY.md). |
| **Equity & reach (low-resource fit)** | Offline-first PWA on a tablet or PC, weekly sync over poor links, open-source (Apache-2.0), no licence cost, no vendor lock-in — deployable from a district hospital to a national hub. |
| **Works in every member state's language** | All six **African Union working languages** (Arabic RTL, English, French, Portuguese, Spanish, Kiswahili), extensible to any African language. See [`LOCALIZATION.md`](LOCALIZATION.md). |
| **Standardised, comparable indicators** | GLOBOCAN-comparable incidence, ASR, and the IARC quality indicators — a common continental yardstick. |
| **Capacity building** | Mirrors the **GICR/AFCRN** hub model and SOPs, so it reinforces (not bypasses) existing regional cancer-registration capacity. |
| **Country-controlled governance** | Each deployment owns its data and infrastructure; the continental tier sees aggregates only. See [`GOVERNANCE.md`](GOVERNANCE.md). |

### Adoption checklist (for an implementer or coordinating body)

- [x] Standards-based data model (IACR core variables, ICD-O-3, TNM)
- [x] Automated data-quality checks (CanReg5-style) and indicators (MV%, DCO%, M/I)
- [x] CI5-style age × site tabulation built in
- [x] National HMIS integration path (DHIS2) and clinical exchange (FHIR/mCODE)
- [x] Data stays sovereign; only de-identified aggregates cross borders
- [x] Offline-first, multilingual, open-source, low-cost
- [ ] Country onboarding: load full ICD-O-3/ICD-11 code lists + census denominators (deploy-time)
- [ ] Authentication, per-user accounts, and CouchDB replication (Phase 1, see [`ROADMAP.md`](ROADMAP.md))
- [ ] Data-sharing agreements & disclosure-control thresholds per the body's policy

In short: the platform is **standards-aligned with IACR** and **architecturally fit** for a continental
surveillance mandate — sovereign, interoperable, equitable and open — so it can be adopted and extended
rather than rebuilt.
