import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../i18n'
import { useSession, DEMO_USERS } from '../state/session'
import { AfricaNetwork } from '../components/AfricaNetwork'
import type { Role } from '../core'

const LINKEDIN_URL = 'https://www.linkedin.com/in/dr-temesgen-endalew/'

const ROLE_COLOR: Record<Role, string> = {
  'data-entry': '#0b6b3a',
  registrar: '#0e7a43',
  'registry-manager': '#0a7d6b',
  'subnational-coordinator': '#0891b2',
  'national-focal-point': '#b8860b',
  'regional-coordinator': '#a45b1f',
  'continental-admin': '#7c3aed',
  researcher: '#2563eb',
  auditor: '#475569',
}

const ICON: Record<string, ReactNode> = {
  offline: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14 0" /><path d="M8.5 16.1a6 6 0 0 1 7 0" /><line x1="12" y1="20" x2="12" y2="20" /><path d="M2 8.5a16 16 0 0 1 20 0" />
    </svg>
  ),
  languages: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" />
    </svg>
  ),
  standards: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 19.3 7.2 17l.9-5.4L4.2 7.7l5.4-.8z" /><path d="M9 12l2 2 4-4" />
    </svg>
  ),
  privacy: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" /><path d="M9 12l2 2 4-4" />
    </svg>
  ),
}

export function Login() {
  const { t, i18n } = useTranslation()
  const { signIn, hierarchy } = useSession()

  const features: { key: string; text: string }[] = [
    { key: 'offline', text: t('login.feat.offline') },
    { key: 'languages', text: t('login.feat.languages') },
    { key: 'standards', text: t('login.feat.standards') },
    { key: 'privacy', text: t('login.feat.privacy') },
  ]

  return (
    <div className="auth">
      <div className="auth-bg" aria-hidden="true">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
      </div>

      <div className="auth-grid">
        {/* Branded hero */}
        <section className="auth-hero">
          <div className="auth-brand">
            <img src="/favicon.svg" alt="" />
            <div>
              <div className="auth-title">{t('app.title')}</div>
              <div className="auth-tagline">{t('app.tagline')}</div>
            </div>
          </div>

          <ul className="auth-feats">
            {features.map((f) => (
              <li className="auth-feat" key={f.key}>
                <span className="ic">{ICON[f.key]}</span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>

          <div className="auth-badges">
            <span>IARC</span>
            <span>ICD-O-3</span>
            <span>FHIR · mCODE</span>
            <span>DHIS2</span>
          </div>

          <AfricaNetwork />

          <div className="auth-credit">
            {t('common.developedBy')} <strong>Dr. Temesgen Endalew</strong>
            <br />
            <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">{t('common.connectLinkedIn')} ↗</a>
          </div>

          <div className="auth-langstrip">
            {LANGUAGES.map((l) => (
              <span key={l.code}>{l.native}</span>
            ))}
          </div>
        </section>

        {/* Sign-in card */}
        <section className="auth-card">
          <div className="field">
            <label>{t('common.language')}</label>
            <select value={i18n.language} onChange={(e) => void i18n.changeLanguage(e.target.value)}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.native}
                </option>
              ))}
            </select>
          </div>

          <h1 className="auth-h1">{t('login.title')}</h1>
          <p className="auth-sub">{t('login.subtitle')}</p>

          <div className="userlist">
            {DEMO_USERS.map((u) => {
              const node = hierarchy.get(u.nodeId)
              return (
                <button key={u.id} className="user" onClick={() => signIn(u.id)}>
                  <span className="user-av" style={{ background: ROLE_COLOR[u.role] }}>
                    {u.name.charAt(0)}
                  </span>
                  <span className="user-meta">
                    <span className="user-name">{u.name}</span>
                    <span className="user-role">
                      {t(`roles.${u.role}`)} · {node?.name ?? u.nodeId}
                    </span>
                  </span>
                  <span className="user-go" aria-hidden="true">→</span>
                </button>
              )
            })}
          </div>

          <div className="auth-note">{t('login.demoNote')}</div>
        </section>
      </div>
    </div>
  )
}
