# Security & privacy

Cancer registries hold some of the most sensitive data in health. ACR's privacy posture is **structural**,
not bolted on: the architecture makes it *hard* for identifiable data to end up where it shouldn't.

## 1. Threat model (summary)

| Asset | Threat | Primary mitigation |
| --- | --- | --- |
| Patient records on a device | Lost/stolen tablet | Device encryption + app PIN/credential; only the user's authorised facility data is ever on the device. |
| Records in transit | Network interception | TLS for all replication and API traffic. |
| Records at rest on server | Server compromise | Registry CouchDB lives in the registry's own trust zone; access controlled; backups encrypted. |
| Upward leakage | PHI flowing to region/country | **Structural**: only aggregate (non-identifying) documents replicate above Tier 2 — see below. |
| Re-identification of aggregates | Small-cell disclosure | Small-cell suppression and k-anonymity review before cells cross a boundary. |
| Insider misuse | Over-broad access | Role × hierarchy scoping; full audit trail; auditor role. |

## 2. The structural privacy guarantee

The strongest control is that **patient records are never replicated above the registry tier**. Regional,
national and continental servers physically hold only aggregate count documents. Even with full
administrative access to a continental server, there are no patient records to expose — they were never
sent. This is enforced by the sync filters (case-level replication is scoped to a registry trust zone) and
by the roll-up job, which emits only de-identified cubes. See [`SYNC.md`](SYNC.md) and
[`ACCESS-CONTROL.md`](ACCESS-CONTROL.md).

## 3. Identifiers

- The synced case record uses a **registry pseudonym** (`patientId`), never a national ID number.
- Direct identifiers needed for de-duplication and follow-up (names, exact addresses, national ID) are kept
  in a **local-only identity store** at the registry and excluded from sync and export by default.
- Researcher exports replace `patientId` with a study-specific pseudonym and generalise dates/geography.

## 4. Audit & consent

- Every create/update/verify is stamped with actor and timestamp; the `auditor` role can review without
  edit rights.
- The notification/consent model is configurable to match each country's law (many operate mandatory
  cancer notification — see the McCabe Centre/IARC/AFCRN legal toolkit). ACR records the legal basis used.

## 5. Legal alignment

- **AU Malabo Convention** (Personal Data Protection) and national data-protection acts → data minimisation,
  in-country storage, purpose limitation.
- **Data sovereignty** → PHI stays in the facility/registry/country; cross-border flows are aggregate-only
  unless a specific lawful agreement says otherwise.

## 6. Operational guidance

- Use HTTPS/TLS everywhere; terminate at the gateway with a valid certificate.
- Enforce per-user credentials; no shared logins. Bind each user to exactly one hierarchy node + role.
- Encrypt device storage and server volumes; encrypt backups; test restore.
- Apply small-cell suppression policy before publishing any dashboard outside the originating registry.
- Keep the full ICD/terminology files and any identity store on registry-controlled infrastructure.

> This document describes the design intent and the controls the platform provides. A production
> deployment still requires a data-protection impact assessment, a security review, and sign-off from the
> relevant national authority before handling real patient data.
