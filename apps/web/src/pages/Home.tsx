import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useSession } from '../state/session'
import { LiveCancerCounter } from '../components/LiveCancerCounter'
import { dailyUpdate } from '../components/DailyUpdateToast'
import { AfricaNetwork } from '../components/AfricaNetwork'
import type { View } from '../App'

const VERCEL_URL = 'https://afya-cancer-registry.vercel.app'
const GITHUB_URL = 'https://github.com/DrTemesgen/afya-cancer-registry'
const LINKEDIN_URL = 'https://www.linkedin.com/in/dr-temesgen-endalew/'

const I = {
  dashboard: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="7" /><rect x="12" y="7" width="3" height="11" /><rect x="17" y="13" width="3" height="5" /></svg>
  ),
  newCase: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M12 12v6M9 15h6" /></svg>
  ),
  registries: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="5" rx="1" /><path d="M12 8v4M6 21v-5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5" /><rect x="3" y="18" width="6" height="3" rx="1" /><rect x="15" y="18" width="6" height="3" rx="1" /></svg>
  ),
  interop: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5" /><path d="M21 3l-7 7" /><path d="M8 21H3v-5" /><path d="M3 21l7-7" /></svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
  ),
}

export function Home({ navigate }: { navigate: (v: View) => void }) {
  const { t } = useTranslation()
  const { user, access, hierarchy } = useSession()
  const node = hierarchy.get(user!.nodeId)
  const canCase = access.canViewCaseLevel(user!)
  const firstName = user!.name.split(' ')[0]

  const actions: { v: View; icon: ReactNode; title: string; desc: string; show: boolean }[] = [
    { v: 'dashboard', icon: I.dashboard, title: t('nav.dashboard'), desc: t('home.openDashboardDesc'), show: true },
    { v: 'newCase', icon: I.newCase, title: t('nav.newCase'), desc: t('home.newCaseDesc'), show: canCase },
    { v: 'registries', icon: I.registries, title: t('nav.registries'), desc: t('home.registriesDesc'), show: true },
    { v: 'interop', icon: I.interop, title: t('nav.interop'), desc: t('home.interopDesc'), show: true },
  ]

  return (
    <div className="home">
      <section className="home-hero">
        <div className="hero-glow" />
        <div className="home-hero-text">
          <h1>{t('home.greeting')}, {firstName} 👋</h1>
          <p>{t(`roles.${user!.role}`)} · {node?.name ?? user!.nodeId} — {t('home.subtitle')}</p>
        </div>
        <div className="home-hero-map">
          <AfricaNetwork />
        </div>
      </section>

      <LiveCancerCounter />

      <div className="update-card">
        <span className="ic">{I.bell}</span>
        <div>
          <h3>{t('home.updateTitle')}</h3>
          <p>{dailyUpdate(t)}</p>
        </div>
      </div>

      <h2 style={{ margin: '4px 0 0' }}>{t('home.quickActions')}</h2>
      <div className="quick-grid">
        {actions
          .filter((a) => a.show)
          .map((a) => (
            <button key={a.v} className="quick" onClick={() => navigate(a.v)}>
              <span className="qic">{a.icon}</span>
              <span className="qt">{a.title}</span>
              <span className="qd">{a.desc}</span>
            </button>
          ))}
      </div>

      <footer className="home-footer">
        <span>
          {t('home.footerTagline')}
          <br />
          <span style={{ fontSize: '0.8rem' }}>
            {t('common.developedBy')} <strong>Dr. Temesgen Endalew</strong>
          </span>
        </span>
        <span className="links">
          <a href={VERCEL_URL} target="_blank" rel="noreferrer">{t('home.footerDemo')} ↗</a>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">{t('home.footerSource')} ↗</a>
          <a href={LINKEDIN_URL} target="_blank" rel="noreferrer">{t('common.connectLinkedIn')} ↗</a>
        </span>
      </footer>
    </div>
  )
}
