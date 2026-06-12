# Sync & Aggregate Gateway

The gateway turns a set of standalone Afya ACR installs into a synchronised federation. It
does two jobs:

1. **Aggregate roll-up** — collects de-identified count cubes from registries and serves them
   up the hierarchy (region → country → continental). This is the *only* data that crosses the
   PHI boundary above the registry tier.
2. **Interoperability** — exposes FHIR/mCODE ingest, DHIS2 `dataValueSet`, and (inside a
   registry trust zone) IARC submission files.

## Run (reference build)

```bash
npm install            # from repo root (workspaces)
npm run dev:gateway    # http://localhost:4000
```

Endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | liveness + cell count |
| GET | `/aggregates?country=KE` `?region=eastern` `?registry=reg-nairobi` | de-identified count cube for a scope |
| GET | `/dhis2/dataValueSet?country=KE` | DHIS2 aggregate export |
| POST | `/fhir/$ingest` | accept an mCODE bundle from an EHR |
| GET | `/fhir/Bundle/:caseId` | **403 by design** above Tier 2 (PHI boundary) |
| GET | `/export/iarc` | **403 by design** above Tier 2 (case-level lives in the registry) |

The 403s are not bugs — they demonstrate the structural privacy guarantee: identifiable
records are never replicated above the registry, so the aggregate gateway *cannot* serve them.

## Production wiring

This reference build uses a small in-memory aggregate set. In production:

- Stand up a **CouchDB per registry** (or Cloudant-compatible). Each device (PWA) replicates
  bidirectionally with its registry CouchDB, filtered to the user's authorised facility:

  ```js
  // CouchDB design doc: _design/acr, filter "by_facility"
  function (doc, req) { return doc.type === 'case' && doc.facilityNodeId === req.query.facility }
  ```

- Run the gateway against the registry CouchDB; a **roll-up job** turns `verified` case docs
  into aggregate cells (the shared `aggregateCases` from `apps/web/src/core`) and pushes them
  up-tier with small-cell suppression applied at the boundary.
- Point the PWA's **Settings → Sync** at the registry CouchDB URL; choose continuous / daily /
  weekly cadence.

See [`../../docs/SYNC.md`](../../docs/SYNC.md) and [`../../docs/SECURITY-PRIVACY.md`](../../docs/SECURITY-PRIVACY.md).
