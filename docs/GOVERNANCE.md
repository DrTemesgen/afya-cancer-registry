# Governance & open source

ACR is open source so that ministries of health, registries, universities and NGOs across Africa can adopt,
audit, localise and extend it without licensing barriers or vendor lock-in.

## Licence

[Apache-2.0](../LICENSE) — permissive, with an explicit patent grant. Chosen so that public bodies and
private implementers alike can deploy and build services around it. Clinical reference materials
(ICD-O-3, ICD-11, TNM) remain under their publishers' terms; ACR ships only small illustrative subsets.

## Intended stewardship

The platform is designed to be governed by, and accountable to, the African cancer-registration community
— in the spirit of **AFCRN** as IARC's regional hub. A healthy governance setup would include:

- A **technical steering group** (registrars + informaticians) owning the data dictionary, value sets and
  validation rules, keeping them aligned with IARC/IACR and ENCR updates.
- A **clinical/terminology group** maintaining translations and ICD-O-3/ICD-11/TNM mappings.
- A **data-governance group** owning the privacy model, disclosure-control thresholds and data-sharing
  templates.
- Country/registry deployments retaining full control of their own data and infrastructure.

## Contributing

- Keep the **clinical core** (`apps/web/src/core`) framework-free and standards-traceable: every coded
  value and check should cite its source (IARC, ICD-O-3, ENCR, mCODE).
- Add tests for any new validation rule or mapping.
- UI strings go through i18n; never hard-code user-facing text.
- Never commit real patient data. Seed/test data must be synthetic.

## Decision record

Significant architectural choices (e.g. PouchDB/CouchDB sync, aggregate-only federation, FHIR/mCODE as the
exchange format) are documented with their rationale in [`ARCHITECTURE.md`](ARCHITECTURE.md) and
[`STANDARDS.md`](STANDARDS.md) so future maintainers understand the *why*, not just the *what*.

## Sustainability

- Low-cost to run: an offline-first PWA needs only modest server infrastructure (a CouchDB + small Node
  service per registry; a single aggregate server per country).
- No proprietary dependencies in the core path.
- Designed for incremental adoption — a single registry can start standalone and federate later.
