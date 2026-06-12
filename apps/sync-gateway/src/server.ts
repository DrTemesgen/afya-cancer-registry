/**
 * Afya Cancer Registry — Sync & Aggregate Gateway.
 *
 * Responsibilities (see ../../docs/SYNC.md, INTEROPERABILITY.md):
 *  - Aggregate roll-up: serve de-identified count cubes up the hierarchy (the only data
 *    that crosses the PHI boundary above the registry tier).
 *  - Interoperability endpoints: FHIR/mCODE ingest, DHIS2 dataValueSet, IARC submission.
 *  - In production it authenticates devices and scopes CouchDB replication per node; this
 *    reference build demonstrates the API surface with a small in-memory aggregate set.
 *
 * The clinical logic (validation, FHIR mapping, aggregation) is shared with the PWA in
 * apps/web/src/core; production wires this service to that package + a CouchDB per registry.
 */
import express from 'express'
import cors from 'cors'
import { DEMO_AGGREGATES, filterByScope, rollUp, toDhis2, type Cell } from './aggregates.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

const PORT = Number(process.env.PORT) || 4000

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'afya-acr-sync-gateway', tiers: 'aggregate (3-6)', cells: DEMO_AGGREGATES.length })
})

/**
 * De-identified aggregate cube for a scope. This is what regional/national/continental
 * dashboards consume — counts only, no patient records.
 *   /aggregates?registry=reg-nairobi | ?country=KE | ?region=eastern
 */
app.get('/aggregates', (req, res) => {
  const cells = scoped(req.query)
  res.json({ scope: describeScope(req.query), count: cells.reduce((s, c) => s + c.count, 0), cells })
})

/** DHIS2 dataValueSet for national HMIS integration (aggregate, no PHI). */
app.get('/dhis2/dataValueSet', (req, res) => {
  const cells = scoped(req.query)
  res.json(toDhis2(cells))
})

/** Accept an mCODE bundle from an EHR (registry trust zone only in production). */
app.post('/fhir/$ingest', (req, res) => {
  const bundle = req.body
  const entries = Array.isArray(bundle?.entry) ? bundle.entry.length : 0
  res.status(202).json({ accepted: true, entries, note: 'Ingested into registry trust zone (demo acknowledges receipt).' })
})

/**
 * Case-level endpoints are NOT served above the registry tier — the structural privacy
 * guarantee. Above Tier 2, identifiable records were never replicated here.
 */
app.get('/fhir/Bundle/:caseId', (_req, res) => {
  res.status(403).json({
    error: 'phi-boundary',
    message:
      'Case-level FHIR is served only inside a registry trust zone with case-level authorisation. ' +
      'This gateway tier holds de-identified aggregates only.',
  })
})

app.get('/export/iarc', (_req, res) => {
  res.status(403).json({
    error: 'phi-boundary',
    message:
      'IARC submission files are generated inside the registry (case-level, pseudonymous) and ' +
      'submitted under a data-sharing agreement — not exposed by the aggregate gateway.',
  })
})

app.listen(PORT, () => {
  /* eslint-disable no-console */
  console.log(`Afya ACR sync gateway → http://localhost:${PORT}`)
  console.log('  GET  /health')
  console.log('  GET  /aggregates?country=KE | ?region=eastern | ?registry=reg-nairobi')
  console.log('  GET  /dhis2/dataValueSet?country=KE')
  console.log('  POST /fhir/$ingest')
  console.log('  (case-level FHIR/IARC are intentionally 403 at this tier — PHI boundary)')
})

// --- helpers ---

function scoped(query: express.Request['query']): Cell[] {
  return filterByScope(DEMO_AGGREGATES, {
    registry: str(query.registry),
    country: str(query.country),
    region: str(query.region),
  })
}

function describeScope(query: express.Request['query']): string {
  return str(query.registry) ?? str(query.country) ?? str(query.region) ?? 'africa'
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length ? v : undefined
}

export { app, rollUp }
