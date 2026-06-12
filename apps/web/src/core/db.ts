/**
 * Offline-first storage on PouchDB (IndexedDB). All reads/writes are local, so the app
 * works fully offline; replication to a registry CouchDB is configured per deployment
 * (continuous, or scheduled daily/weekly). See ../../docs/SYNC.md.
 */
import PouchDB from 'pouchdb-browser'
import type { CaseRecord } from './types'

export type SyncCadence = 'continuous' | 'daily' | 'weekly' | 'manual'

export interface SyncConfig {
  remoteUrl: string
  cadence: SyncCadence
  /** filter so a device only pulls its authorised facility/registry (set at deploy). */
  facilityNodeId?: string
}

export interface SyncStatus {
  state: 'idle' | 'active' | 'paused' | 'error' | 'offline'
  lastSync?: string
  pending?: number
  message?: string
}

export class CaseStore {
  private db: PouchDB.Database<CaseRecord>
  private syncHandle: PouchDB.Replication.Sync<object> | null = null

  constructor(name = 'afya-acr-cases') {
    this.db = new PouchDB<CaseRecord>(name)
  }

  async put(record: CaseRecord): Promise<CaseRecord> {
    const res = await this.db.put(record)
    return { ...record, _rev: res.rev }
  }

  async bulkPut(records: CaseRecord[]): Promise<void> {
    await this.db.bulkDocs(records)
  }

  async get(id: string): Promise<CaseRecord | undefined> {
    try {
      return await this.db.get(id)
    } catch {
      return undefined
    }
  }

  async all(): Promise<CaseRecord[]> {
    const res = await this.db.allDocs({ include_docs: true })
    return res.rows
      .map((r) => r.doc as CaseRecord)
      .filter((d): d is CaseRecord => !!d && d.type === 'case')
  }

  async remove(record: CaseRecord): Promise<void> {
    if (record._rev) await this.db.remove(record._id, record._rev)
  }

  async count(): Promise<number> {
    const info = await this.db.info()
    return info.doc_count
  }

  async clear(): Promise<void> {
    await this.db.destroy()
    this.db = new PouchDB<CaseRecord>('afya-acr-cases')
  }

  /**
   * Start replication with a registry CouchDB. `continuous` runs live two-way sync;
   * the scheduled cadences are driven by the app's scheduler calling syncOnce().
   */
  startSync(config: SyncConfig, onStatus?: (s: SyncStatus) => void): void {
    if (this.syncHandle) this.syncHandle.cancel()
    const opts: PouchDB.Replication.SyncOptions = {
      live: config.cadence === 'continuous',
      retry: true,
    }
    if (config.facilityNodeId) {
      // server-side filter scopes replication to the authorised facility (security control)
      opts.filter = 'acr/by_facility'
      opts.query_params = { facility: config.facilityNodeId }
    }
    this.syncHandle = this.db
      .sync<object>(config.remoteUrl, opts)
      .on('active', () => onStatus?.({ state: 'active' }))
      .on('paused', (err) => onStatus?.({ state: err ? 'error' : 'paused', lastSync: nowIso() }))
      .on('denied', (err) => onStatus?.({ state: 'error', message: String(err) }))
      .on('error', (err) => onStatus?.({ state: 'error', message: String(err) }))
  }

  /** One-shot sync for scheduled (daily/weekly/manual) cadences. */
  async syncOnce(config: SyncConfig): Promise<SyncStatus> {
    try {
      await this.db.sync(config.remoteUrl, { retry: false })
      return { state: 'idle', lastSync: nowIso() }
    } catch (err) {
      return { state: 'error', message: String(err) }
    }
  }

  stopSync(): void {
    this.syncHandle?.cancel()
    this.syncHandle = null
  }
}

function nowIso(): string {
  return new Date().toISOString()
}
