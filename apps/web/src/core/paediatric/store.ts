/**
 * Offline-first store for paediatric-cancer registry records, mirroring the
 * main CaseStore but scoped to `type: 'paed-case'` documents in their own
 * PouchDB database. Reads/writes are local (IndexedDB); replication to a
 * registry CouchDB is configured per deployment. See ../db.ts.
 */
import PouchDB from 'pouchdb-browser'
import type { PaedCase } from './instrument'

export class PaedStore {
  private db: PouchDB.Database<PaedCase>

  constructor(name = 'afya-acr-paed') {
    this.db = new PouchDB<PaedCase>(name)
  }

  async put(record: PaedCase): Promise<PaedCase> {
    const res = await this.db.put(record)
    return { ...record, _rev: res.rev }
  }

  async get(id: string): Promise<PaedCase | undefined> {
    try {
      return await this.db.get(id)
    } catch {
      return undefined
    }
  }

  async all(): Promise<PaedCase[]> {
    const res = await this.db.allDocs({ include_docs: true })
    return res.rows
      .map((r) => r.doc as PaedCase)
      .filter((d): d is PaedCase => !!d && d.type === 'paed-case')
  }

  async remove(record: PaedCase): Promise<void> {
    if (record._rev) await this.db.remove(record._id, record._rev)
  }

  async count(): Promise<number> {
    return (await this.all()).length
  }
}
