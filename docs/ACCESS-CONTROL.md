# Access control — roles, hierarchy & scope

Access in ACR is the **intersection of two axes**:

1. **Role** — *what kind of actions* a user may perform (enter data, verify, manage a registry, view
   aggregates, administer).
2. **Hierarchy node** — *where in the federation* the user sits. A user is bound to one node; their data
   scope is that node and everything beneath it, subject to the PHI boundary.

This mirrors how the Community Health Toolkit scopes replication per user, and how real registry networks
delegate authority (clerk → registrar → national focal point → regional/continental coordinator).

## 1. The hierarchy node

```ts
HierarchyNode {
  id, type: 'continental'|'au-region'|'country'|'subnational'|'registry'|'facility',
  name, parentId, countryIso?, auRegion?
}
```

The tree (illustrative seed in [`reference/geography.ts`](../apps/web/src/core/reference/geography.ts)):

```
continental: Africa
└── au-region: Eastern Africa
    └── country: Kenya
        └── subnational: Nairobi County
            └── registry: Nairobi Cancer Registry (PBCR)
                └── facility: Kenyatta National Hospital
```

## 2. Roles

| Role | Typical user | Can do |
| --- | --- | --- |
| `data-entry` | Registry clerk / abstractor | Create & edit **draft/complete** case records at their facility. Cannot verify. |
| `registrar` | Registrar | Everything `data-entry` can, **plus verify** records and resolve QC flags, run registry dashboards. |
| `registry-manager` | Registry lead | Manage facilities, users and codebooks within the registry; configure sync; export FHIR/DHIS2/IARC files. |
| `subnational-coordinator` | Province/state focal point | **Aggregate-only** view across registries in the sub-national region. No PHI. |
| `national-focal-point` | Ministry of Health | Aggregate-only view across the country; DHIS2 export; LMIC/global comparison. |
| `regional-coordinator` | AFCRN/AU regional hub | Aggregate-only view across the AU region. |
| `continental-admin` | IARC/AU continental hub | Aggregate-only view across all of Africa; manage reference benchmarks. |
| `researcher` | Approved researcher | Read-only **de-identified** case extracts or aggregates, scoped by an approved data-sharing agreement. |
| `auditor` | Data-protection / QA | Read-only access to audit trails and QC, no data edit. |

## 3. The PHI boundary

The single most important rule:

> **Identifiable case-level records are visible only at Tier 1–2 (facility & registry).**
> At Tier 3 and above, users see **de-identified aggregates** only.

Concretely, `rbac.ts` enforces:

- `canViewCaseLevel(user)` → true only for roles bound to a `facility` or `registry` node.
- `canVerify(user)` → `registrar`, `registry-manager`.
- `canEdit(user, record)` → record's `facilityNodeId` is within the user's scope **and** role allows write.
- `visibleScope(user)` → the set of node ids at/under the user's node.
- `aggregatesOnly(user)` → true for Tier 3+ roles and `researcher` (unless their agreement grants
  record-level de-identified access).

The sync layer enforces the same boundary physically: case-level replication is filtered to the user's
registry; up-tier replication carries only aggregate documents (see [`SYNC.md`](SYNC.md)). So even a
compromised regional device **cannot** hold patient records — they were never replicated to it.

## 4. Field-level de-identification

When a `researcher` is granted record-level de-identified access, the export pipeline strips/【generalises】:

- direct identifiers (`patientId` replaced with a study pseudonym, names never stored in synced records),
- exact dates → month/year or age-at-incidence,
- sub-national residence → region only,
- rare combinations flagged for k-anonymity review before release.

## 5. Worked example

A `national-focal-point` for Kenya opens the dashboard:

- `visibleScope` = Kenya and all nodes beneath it.
- `aggregatesOnly` = true → the case list is hidden; only count documents and quality indicators load.
- They can drill from Kenya → Nairobi County → Nairobi Cancer Registry, seeing **counts and rates**, and
  compare Kenya against the Eastern-Africa region, the LMIC benchmark and the global benchmark.
- They can export the national aggregate as a DHIS2 `dataValueSet`.
- They **cannot** open an individual patient — that capability does not exist at their tier.
