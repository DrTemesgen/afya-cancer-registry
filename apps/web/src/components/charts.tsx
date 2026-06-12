/**
 * Tiny dependency-free charts rendered from local data, so dashboards work fully offline
 * and load instantly on low-end tablets. Horizontal bars + a comparison bar group.
 */

export interface BarDatum {
  label: string
  value: number
  hint?: string
}

export function BarList({ data, unit }: { data: BarDatum[]; unit?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="barlist">
      {data.map((d) => (
        <div className="barlist-row" key={d.label}>
          <div className="barlist-label" title={d.hint ?? d.label}>
            {d.label}
          </div>
          <div className="barlist-track">
            <div className="barlist-fill" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <div className="barlist-value">
            {formatNum(d.value)}
            {unit ? ` ${unit}` : ''}
          </div>
        </div>
      ))}
    </div>
  )
}

export interface CompareDatum {
  label: string
  value: number
  highlight?: boolean
}

/** A small grouped comparison (e.g. this scope vs LMIC vs Global). */
export function CompareBars({ data, unit }: { data: CompareDatum[]; unit?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="compare">
      {data.map((d) => (
        <div className={`compare-col${d.highlight ? ' compare-col--hl' : ''}`} key={d.label}>
          <div className="compare-bar-area">
            <div className="compare-bar" style={{ height: `${(d.value / max) * 100}%` }} />
          </div>
          <div className="compare-val">
            {formatNum(d.value)}
            {unit ? <span className="compare-unit"> {unit}</span> : null}
          </div>
          <div className="compare-label">{d.label}</div>
        </div>
      ))}
    </div>
  )
}

export function Stat({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'fair' | 'poor' }) {
  return (
    <div className={`stat${tone ? ` stat--${tone}` : ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function formatNum(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { maximumFractionDigits: 1 })
}
