/**
 * Animated Africa network: a recognisable silhouette of the continent with glowing nodes
 * at the anchor registries, connected by links along which pulses travel (the connections
 * visibly "work"). Pure inline SVG + CSS + SMIL motion — no GIF, works fully offline.
 */

interface Node {
  id: string
  x: number
  y: number
}

// Registry/city nodes placed at their approximate geographic positions on the silhouette.
const NODES: Node[] = [
  { id: 'ma', x: 80, y: 106 }, // Morocco
  { id: 'eg', x: 236, y: 96 }, // Egypt — Gharbiah
  { id: 'sn', x: 54, y: 186 }, // Senegal
  { id: 'ng', x: 120, y: 214 }, // Nigeria — Ibadan
  { id: 'cm', x: 152, y: 226 }, // Cameroon — Yaoundé
  { id: 'et', x: 272, y: 182 }, // Ethiopia
  { id: 'ke', x: 262, y: 218 }, // Kenya — Nairobi
  { id: 'zw', x: 222, y: 298 }, // Zimbabwe — Harare
  { id: 'za', x: 205, y: 344 }, // South Africa
]

const LINKS: [string, string][] = [
  ['ma', 'sn'], ['ma', 'eg'], ['sn', 'ng'], ['ng', 'cm'], ['cm', 'ke'],
  ['eg', 'et'], ['et', 'ke'], ['ke', 'zw'], ['cm', 'zw'], ['zw', 'za'], ['ng', 'eg'],
]

// Links that carry a travelling pulse (the "working" connections).
const PULSES: [string, string][] = [
  ['ma', 'eg'], ['sn', 'ng'], ['ng', 'cm'], ['cm', 'ke'], ['eg', 'et'], ['ke', 'zw'], ['zw', 'za'],
]

const STARS = [
  { x: 150, y: 150 }, { x: 210, y: 150 }, { x: 120, y: 250 },
  { x: 240, y: 250 }, { x: 96, y: 170 }, { x: 250, y: 120 }, { x: 180, y: 320 },
]

// Recognisable Africa outline (faceted): Mediterranean top, Horn of Africa east point,
// southern taper to the Cape, West-African bulge and the Gulf of Guinea concavity.
const SILHOUETTE =
  'M70,84 L120,70 L180,66 L220,70 L250,76 L258,96 L268,130 L282,156 L330,170 ' +
  'L298,196 L280,222 L272,250 L262,288 L240,322 L222,344 L200,366 L180,356 ' +
  'L162,318 L150,282 L140,250 L156,228 L132,224 L104,232 L76,226 L52,212 ' +
  'L32,186 L40,150 L52,114 L70,84 Z'

const at = (id: string) => NODES.find((n) => n.id === id)!

export function AfricaNetwork() {
  return (
    <svg className="africa-net" viewBox="0 0 360 400" role="img" aria-label="Africa registry network">
      <path className="africa-silhouette" d={SILHOUETTE} />
      {/* Madagascar */}
      <ellipse className="africa-silhouette" cx="304" cy="300" rx="9" ry="26" transform="rotate(-16 304 300)" />

      {/* twinkling stars */}
      {STARS.map((s, i) => (
        <circle key={`star${i}`} className="map-star" cx={s.x} cy={s.y} r="1.4" style={{ animationDelay: `${i * 0.35}s` }} />
      ))}

      {/* connection lines */}
      {LINKS.map(([a, b], i) => {
        const p = at(a)
        const q = at(b)
        return (
          <g key={`l${i}`}>
            <line className="map-base" x1={p.x} y1={p.y} x2={q.x} y2={q.y} />
            <line className="map-link" x1={p.x} y1={p.y} x2={q.x} y2={q.y} style={{ animationDelay: `${(i % 4) * 0.3}s` }} />
          </g>
        )
      })}

      {/* travelling pulses — the working connections */}
      {PULSES.map(([a, b], i) => {
        const p = at(a)
        const q = at(b)
        return (
          <circle key={`p${i}`} className="map-pulse" r="2.6">
            <animateMotion dur="2.6s" repeatCount="indefinite" begin={`${i * 0.35}s`} calcMode="linear" values={`${p.x},${p.y};${q.x},${q.y}`} />
            <animate attributeName="opacity" dur="2.6s" repeatCount="indefinite" begin={`${i * 0.35}s`} values="0;1;1;0" keyTimes="0;0.12;0.88;1" />
          </circle>
        )
      })}

      {/* pulsing nodes */}
      {NODES.map((n, i) => (
        <g key={n.id}>
          <circle className="map-node-ring" cx={n.x} cy={n.y} r="6" style={{ animationDelay: `${i * 0.26}s` }} />
          <circle className="map-node-core" cx={n.x} cy={n.y} r="3.4" />
        </g>
      ))}
    </svg>
  )
}
