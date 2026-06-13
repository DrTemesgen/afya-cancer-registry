import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../i18n'
import { useSession } from '../state/session'
import type { View } from '../App'

export function Layout({
  view,
  navigate,
  children,
}: {
  view: View
  navigate: (v: View) => void
  children: ReactNode
}) {
  const { t, i18n } = useTranslation()
  const { user, access, signOut } = useSession()
  const online = useOnline()

  const canCase = user ? access.canViewCaseLevel(user) : false

  const items: { key: View; label: string; show: boolean }[] = [
    { key: 'home', label: t('nav.home'), show: true },
    { key: 'dashboard', label: t('nav.dashboard'), show: true },
    { key: 'newCase', label: t('nav.newCase'), show: canCase },
    { key: 'paediatric', label: t('nav.paediatric'), show: canCase },
    { key: 'cases', label: t('nav.cases'), show: true },
    { key: 'registries', label: t('nav.registries'), show: true },
    { key: 'interop', label: t('nav.interop'), show: true },
    { key: 'settings', label: t('nav.settings'), show: true },
  ]

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
        <div className="brand">
          <img src="/favicon.svg" alt="" />
          <span>{t('app.title')}</span>
        </div>
        <nav className="nav">
          {items
            .filter((i) => i.show)
            .map((i) => (
              <button
                key={i.key}
                className={view === i.key ? 'active' : ''}
                onClick={() => navigate(i.key)}
              >
                {i.label}
              </button>
            ))}
        </nav>
        <div className="spacer" />
        <select
          aria-label={t('common.language')}
          value={i18n.language}
          onChange={(e) => void i18n.changeLanguage(e.target.value)}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.native}
            </option>
          ))}
        </select>
        {user && (
          <div className="userchip" title={t(`roles.${user.role}`)}>
            <span className={`online-dot${online ? '' : ' off'}`} />
            <span>{user.name}</span>
            <button
              onClick={signOut}
              style={{ background: 'transparent', color: '#fff', border: 'none', textDecoration: 'underline' }}
            >
              {t('nav.signOut')}
            </button>
          </div>
        )}
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  )
}

function useOnline(): boolean {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}
