/**
 * Animated Africa network: a stylised silhouette of the continent with glowing nodes at
 * the anchor registries, connected by flowing, sparkling links. Pure inline SVG + CSS
 * animation (no GIF / external asset), so it is crisp and works fully offline.
 */

interface Node {
  id: string
  x: number
  y: number
}

// Approximate positions of the five anchor registries (+ a few cities) on the silhouette.
const NODES: Node[] = [
  { id: 'ma', x: 80, y: 96 }, // Morocco
  { id: 'eg', x: 224, y: 90 }, // Egypt — Gharbiah
  { id: 'sn', x: 64, y: 168 }, // Senegal
  { id: 'ng', x: 116, y: 196 }, // Nigeria — Ibadan
  { id: 'cm', x: 166, y: 214 }, // Cameroon — Yaoundé
  { id: 'et', x: 262, y: 178 }, // Ethiopia
  { id: 'ke', x: 250, y: 214 }, // Kenya — Nairobi
  { id: 'zw', x: 212, y: 298 }, // Zimbabwe — Harare
  { id: 'za', x: 202, y: 346 }, // South Africa
]

const LINKS: [string, string][] = [
  ['ma', 'sn'], ['sn', 'ng'], ['ng', 'cm'], ['cm', 'ke'], ['ke', 'et'],
  ['et', 'eg'], ['eg', 'ma'], ['cm', 'zw'], ['zw', 'za'], ['ke', 'zw'], ['ng', 'eg'],
]

const STARS = [
  { x: 120, y: 120 }, { x: 200, y: 150 }, { x: 150, y: 260 },
  { x: 240, y: 260 }, { x: 100, y: 240 }, { x: 230, y: 120 }, { x: 180, y: 320 },
]

const SILHOUETTE =
  'M72,72 Q140,54 210,56 Q236,60 240,80 Q250,112 256,128 Q300,152 324,178 ' +
  'Q302,190 260,198 Q274,236 270,276 Q252,332 216,362 Q196,342 182,332 ' +
  'Q150,302 142,270 Q150,238 152,232 Q120,214 98,204 Q62,192 42,178 ' +
  'Q54,136 62,114 Q64,90 72,72 Z'

const at = (id: string) => NODES.find((n) => n.id === id)!

export function AfricaNetwork() {
  return (
    <svg className="africa-net" viewBox="0 0 360 400" role="img" aria-label="Africa registry network">
      <path className="africa-silhouette" d={SILHOUETTE} />
      {/* Madagascar */}
      <ellipse className="africa-silhouette" cx="306" cy="300" rx="9" ry="24" transform="rotate(-18 306 300)" />

      {/* twinkling stars */}
      {STARS.map((s, i) => (
        <circle key={`star${i}`} className="map-star" cx={s.x} cy={s.y} r="1.4" style={{ animationDelay: `${i * 0.35}s` }} />
      ))}

      {/* flowing connection lines */}
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

      {/* pulsing nodes */}
      {NODES.map((n, i) => (
        <g key={n.id}>
          <circle className="map-node-ring" cx={n.x} cy={n.y} r="6" style={{ animationDelay: `${i * 0.26}s` }} />
          <circle className="map-node-core" cx={n.x} cy={n.y} r="3.2" />
        </g>
      ))}
    </svg>
  )
}
