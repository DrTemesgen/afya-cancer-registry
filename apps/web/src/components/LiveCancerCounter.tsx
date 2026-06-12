import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Worldometer-style live cancer counter. The totals are MODELLED ESTIMATES: annual
 * GLOBOCAN figures spread evenly across the year and accumulated to "now", ticking each
 * second. This is illustrative awareness data — not live surveillance.
 *
 * GLOBOCAN 2022 (approx): world ~19.98M new cases / ~9.74M deaths per year.
 * Africa (all): ~1.18M new cases / ~0.75M deaths per year.
 */
const ANNUAL = {
  worldCases: 19_976_499,
  worldDeaths: 9_743_832,
  africaCases: 1_180_000,
  africaDeaths: 753_000,
}
const YEAR_MS = 365.25 * 24 * 3600 * 1000

function msSinceYearStart(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1).getTime()
  return now.getTime() - start
}

export function LiveCancerCounter() {
  const { t } = useTranslation()
  const [ms, setMs] = useState(msSinceYearStart)

  useEffect(() => {
    const id = setInterval(() => setMs(msSinceYearStart()), 250)
    return () => clearInterval(id)
  }, [])

  const frac = ms / YEAR_MS
  const fmt = (n: number) => Math.floor(n).toLocaleString()

  const cells = [
    { key: 'worldCases', cls: 'cases', val: ANNUAL.worldCases * frac, label: t('home.worldCases') },
    { key: 'worldDeaths', cls: 'deaths', val: ANNUAL.worldDeaths * frac, label: t('home.worldDeaths') },
    { key: 'africaCases', cls: 'cases', val: ANNUAL.africaCases * frac, label: t('home.africaCases') },
    { key: 'africaDeaths', cls: 'deaths', val: ANNUAL.africaDeaths * frac, label: t('home.africaDeaths') },
  ]

  return (
    <div className="counter-panel">
      <div className="counter-head">
        <span className="counter-title">{t('home.liveTitle')}</span>
        <span className="counter-live">
          <span className="dot" /> {t('home.thisYear')}
        </span>
      </div>
      <div className="counter-grid">
        {cells.map((c) => (
          <div className="counter-cell" key={c.key}>
            <div className={`counter-num ${c.cls}`}>{fmt(c.val)}</div>
            <div className="counter-label">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="counter-note">{t('home.liveNote')}</div>
    </div>
  )
}
