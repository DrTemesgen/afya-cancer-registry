# Seed & reference data

This platform ships **synthetic** data and **illustrative subsets** of reference
classifications so it runs end-to-end out of the box. None of it is real patient data, and
none of the classifications here are complete.

## What ships in code

| Data | Location | Notes |
| --- | --- | --- |
| African geography (AU regions → countries → registries → facilities) | [`apps/web/src/core/reference/geography.ts`](../../apps/web/src/core/reference/geography.ts) | One anchor registry per AU region (Gharbiah, Ibadan, Yaoundé, Nairobi, Harare). |
| ICD-O-3 topography & morphology subset | [`apps/web/src/core/reference/icdo3.ts`](../../apps/web/src/core/reference/icdo3.ts) | ~40 sites + ~27 morphologies weighted to African cancers. |
| Coded value sets (sex, basis, behaviour, …) | [`apps/web/src/core/valuesets.ts`](../../apps/web/src/core/valuesets.ts) | Translated into all six AU languages. |
| Synthetic cases | [`apps/web/src/core/seed.ts`](../../apps/web/src/core/seed.ts) | Deterministic generator, ~80 cases × 5 registries. |

## What you load at deployment (under the publishers' terms)

- **Full ICD-O-3.2** topography & morphology with multilingual display terms (IARC/WHO).
- **ICD-10 / ICD-11** and the ICD-O→ICD crosswalk tables (WHO).
- **UICC TNM** and IARC **Essential TNM** staging schemes.
- Optional **SNOMED CT / LOINC** for licensed deployments (FHIR/mCODE bindings).
- National **population denominators by age & sex** (census) for true age-standardised rates —
  the demo approximates these with a modelled African age structure.

A loader that reads the official IARC code files into the same shapes used here is part of the
Phase-1 roadmap ([`docs/ROADMAP.md`](../../docs/ROADMAP.md)).

> Replace the synthetic cases and illustrative subsets before any real-world use, and complete
> a data-protection impact assessment first (see [`docs/SECURITY-PRIVACY.md`](../../docs/SECURITY-PRIVACY.md)).
