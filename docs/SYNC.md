# Synchronisation — offline-first, two-tier federation

ACR's sync model has to satisfy four constraints at once:

1. Work for **days/weeks fully offline** on a tablet or PC.
2. Sync on a **daily or weekly** cadence (or continuously when a network exists), over poor/expensive links.
3. Keep **identifiable data local** and only move **de-identified aggregates** up the hierarchy.
4. Tolerate **conflicts** (the same registry edited on two devices) without losing data.

The answer is **CouchDB/PouchDB filtered replication** for case-level data within a registry, and an
**aggregate roll-up** for everything above the registry.

## 1. Tier 1–2 — case-level replication (within the trust zone)

```
Tablet A ─┐
Tablet B ─┼─ PouchDB (IndexedDB)  ⇄  Registry CouchDB  (one per registry)
Desktop ──┘        filtered replication scoped to the user's facility
```

- Each device runs **PouchDB** in the browser (IndexedDB). All reads/writes are local → the app is
  instant and fully functional offline.
- Replication to the registry **CouchDB** is **bidirectional and filtered**: a device only ever pulls the
  documents for facilities the user is authorised for. This is both a performance and a security control —
  unauthorised records never reach the device.
- **Cadence** is configurable per deployment:
  - `continuous` — live two-way sync when online (default when a stable network exists).
  - `scheduled` — a sync window, e.g. *daily 02:00* or *weekly Sunday*, for metered/intermittent links.
  - `manual` — clerk taps **Sync now** (e.g. when they reach a connected location).
- **Conflicts** use CouchDB's MVCC. Each document has a revision tree; concurrent edits create a conflict
  that ACR resolves with domain rules: a `verified` record beats a `draft`; otherwise the later
  `updatedAt` wins, and the losing revision is retained for audit. Registrars see a small "review
  conflicts" queue.

## 2. Tier 2 → Tier 3+ — aggregate roll-up (the PHI boundary)

Above the registry, **no patient records move**. Instead the gateway computes **de-identified aggregate
documents** and replicates *those* upward.

```
Registry CouchDB ──(roll-up)──► aggregate docs ──► Sub-national ──► Country ──► AU Region ──► Continental
   (case-level, PHI)              (counts only)        (counts)       (counts)     (counts)     (counts)
```

An aggregate document is a count cube cell:

```jsonc
{
  "_id": "agg:KE:nairobi-pbcr:2023:C50:2:45-49:7:II",
  "type": "aggregate",
  "registryNodeId": "reg-nairobi",
  "countryIso": "KE", "auRegion": "eastern", "year": 2023,
  "topographyGroup": "C50",   // breast
  "sex": 2, "ageGroup": "45-49",
  "basisOfDiagnosis": 7, "stage": "II",
  "count": 12,
  "quality": { "mvPercent": 83.3, "dcoPercent": 4.2 }
}
```

Because cells are keyed by coded dimensions only (no patient, no dates finer than year), they are
non-identifying, tiny (kilobytes per registry-year), and additive — a country total is just the sum of its
registries' cells. Small-cell suppression (e.g. counts < 5) can be applied before a cell crosses a
boundary, per the deployment's disclosure-control policy.

## 3. Where heavy analytics live

For dashboards that need flexible querying, the gateway streams CouchDB changes into **PostgreSQL**
(the couch2pg / CHT-Sync pattern). Aggregates and quality indicators are materialised there; the PWA
dashboards can also compute them directly from local data when offline.

## 4. Putting it together (sequence)

```
clerk saves case ──► PouchDB (local, offline OK)
        │  (next sync window / online)
        ▼
   filtered replication ──► Registry CouchDB
        │
        ▼  gateway roll-up job (verified records only)
   aggregate docs ──► up-tier replication ──► national / regional / continental dashboards
        │
        ▼  on demand
   FHIR/mCODE bundle (case)  ·  DHIS2 dataValueSet (aggregate)  ·  IARC submission file
```

## 5. What this repo ships vs. needs at deploy time

- **Ships & runs now:** the PWA with **PouchDB local storage** (full offline CRUD, the app is usable with
  zero servers), the aggregate computation in `core/aggregate.ts`, and a `sync-gateway` service that
  exposes health, aggregate roll-up and interoperability endpoints, with a documented CouchDB target.
- **At deploy time:** stand up a CouchDB per registry (or use IBM Cloudant/compatible), point the PWA's
  sync config at it, and run the gateway with the up-tier targets configured. See
  [`apps/sync-gateway/README.md`](../apps/sync-gateway/README.md).

## 6. Why not just one big online database?

Because the field reality is intermittent power and connectivity, metered data, and strict (and correct)
expectations that patient data stays in-country and in-facility. A centralised always-online design fails
the clerk in the district hospital and complicates data-sovereignty compliance. Offline-first +
aggregate federation is the pattern that has actually scaled in African health systems.
