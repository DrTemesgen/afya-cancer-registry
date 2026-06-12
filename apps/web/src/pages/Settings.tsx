import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../i18n'
import { useSession } from '../state/session'
import type { SyncCadence, SyncStatus } from '../core'

const SYNC_KEY = 'afya-acr-sync'

interface StoredSync {
  remoteUrl: string
  cadence: SyncCadence
}

function loadSync(): StoredSync {
  try {
    const raw = localStorage.getItem(SYNC_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return { remoteUrl: '', cadence: 'continuous' }
}

export function Settings() {
  const { t, i18n } = useTranslation()
  const { cases, store, reseed } = useSession()
  const [sync, setSync] = useState<StoredSync>(loadSync)
  const [status, setStatus] = useState<SyncStatus>({ state: 'idle' })
  const [busy, setBusy] = useState(false)

  function persist(next: StoredSync) {
    setSync(next)
    localStorage.setItem(SYNC_KEY, JSON.stringify(next))
  }

  async function syncNow() {
    if (!sync.remoteUrl) {
      setStatus({ state: 'error', message: t('settings.remoteUrl') })
      return
    }
    setBusy(true)
    setStatus({ state: 'active' })
    const result = await store.syncOnce({ remoteUrl: sync.remoteUrl, cadence: sync.cadence })
    setStatus(result)
    setBusy(false)
  }

  const installed = typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true

  return (
    <div>
      <h1>{t('settings.title')}</h1>

      <div className="grid cols-2">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{t('settings.language')}</h2>
          <div className="field">
            <select value={i18n.language} onChange={(e) => void i18n.changeLanguage(e.target.value)}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.native} ({l.code}{l.dir === 'rtl' ? ', RTL' : ''})
                </option>
              ))}
            </select>
          </div>
          <h2>{t('settings.data')}</h2>
          <p className="sub">
            {t('settings.caseCount')}: <strong>{cases.length.toLocaleString()}</strong>
          </p>
          <button className="btn secondary" onClick={() => void reseed()}>{t('settings.reseed')}</button>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>{t('settings.sync')}</h2>
          <div className="field" style={{ marginBottom: 10 }}>
            <label>{t('settings.remoteUrl')}</label>
            <input
              placeholder="https://couchdb.example.org/registry"
              value={sync.remoteUrl}
              onChange={(e) => persist({ ...sync, remoteUrl: e.target.value })}
            />
          </div>
          <div className="field" style={{ marginBottom: 10 }}>
            <label>{t('settings.syncCadence')}</label>
            <select value={sync.cadence} onChange={(e) => persist({ ...sync, cadence: e.target.value as SyncCadence })}>
              {(['continuous', 'daily', 'weekly', 'manual'] as SyncCadence[]).map((c) => (
                <option key={c} value={c}>{t(`settings.cadence.${c}`)}</option>
              ))}
            </select>
          </div>
          <div className="toolbar" style={{ marginTop: 0 }}>
            <button className="btn" disabled={busy} onClick={() => void syncNow()}>{t('settings.syncNow')}</button>
            <span className="badge">
              {t('settings.syncState.' + status.state)}
              {status.lastSync ? ` · ${new Date(status.lastSync).toLocaleString()}` : ''}
            </span>
          </div>
          {status.message && status.state === 'error' && (
            <p className="help" style={{ color: 'var(--error)' }}>{status.message}</p>
          )}
          <p className="help" style={{ color: 'var(--muted)', marginTop: 10 }}>
            {online ? '● ' + t('settings.onlineNow') : '○ ' + t('settings.syncState.offline')}
            {installed ? ' · ' + t('settings.offlineReady') : ''}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>{t('settings.about')}</h2>
        <p className="sub" style={{ marginBottom: 0 }}>{t('settings.aboutText')}</p>
      </div>
    </div>
  )
}
