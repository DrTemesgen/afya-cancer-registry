import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

/** The cancer-awareness update for today, rotating by day-of-year. */
export function dailyUpdate(t: TFunction): string {
  const updates = t('home.updates', { returnObjects: true }) as unknown
  if (!Array.isArray(updates) || updates.length === 0) return ''
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1).getTime()
  const day = Math.floor((now.getTime() - start) / 86_400_000)
  return updates[day % updates.length] as string
}

const Bell = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
)

/**
 * A notification that slides up from the corner shortly after the app loads, carrying the
 * daily cancer update. Dismissible. Mounted once at the app level.
 */
export function DailyUpdateToast() {
  const { t } = useTranslation()
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 2500)
    return () => clearTimeout(timer)
  }, [])

  if (!show) return null
  return (
    <div className="toast" role="status">
      <span className="tic">
        <Bell />
      </span>
      <div style={{ flex: 1 }}>
        <div className="ttitle">{t('home.notifTitle')}</div>
        <div className="tbody">{dailyUpdate(t)}</div>
      </div>
      <button className="tclose" onClick={() => setShow(false)} aria-label={t('home.dismiss')}>
        ×
      </button>
    </div>
  )
}
