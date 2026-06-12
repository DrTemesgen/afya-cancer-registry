/**
 * Animated Africa registry network. Uses a real, recoloured country-border map of Africa
 * (public/africa-map.svg, viewBox 1000×1000) as the base, with glowing nodes placed on the
 * actual registry countries and pulses of light that travel from one country to another.
 * Node positions are the computed centroids of each country on the map.
 */

interface Node {
  id: string
  x: number
  y: number
}

// Country centroids on the 1000×1000 map (computed from the source SVG geometry).
const NODES: Node[] = [
  { id: 'ma', x: 225, y: 80 }, // Morocco
  { id: 'eg', x: 665, y: 150 }, // Egypt — Gharbiah
  { id: 'sn', x: 130, y: 318 }, // Senegal
  { id: 'ng', x: 409, y: 392 }, // Nigeria — Ibadan
  { id: 'cm', x: 455, y: 416 }, // Cameroon — Yaoundé
  { id: 'et', x: 796, y: 392 }, // Ethiopia
  { id: 'ke', x: 766, y: 518 }, // Kenya — Nairobi
  { id: 'zw', x: 656, y: 780 }, // Zimbabwe — Harare
  { id: 'za', x: 599, y: 910 }, // South Africa
]

const LINKS: [string, string][] = [
  ['ma', 'eg'], ['ma', 'sn'], ['sn', 'ng'], ['ng', 'cm'], ['cm', 'ke'],
  ['eg', 'et'], ['et', 'ke'], ['ke', 'zw'], ['cm', 'zw'], ['zw', 'za'], ['ng', 'eg'],
]

// Links along which a pulse of light travels (country → country).
const PULSES: [string, string][] = [
  ['ma', 'eg'], ['sn', 'ng'], ['ng', 'cm'], ['cm', 'ke'],
  ['eg', 'et'], ['et', 'ke'], ['ke', 'zw'], ['zw', 'za'],
]

const STARS = [
  { x: 520, y: 300 }, { x: 360, y: 560 }, { x: 700, y: 640 },
  { x: 300, y: 230 }, { x: 620, y: 470 }, { x: 520, y: 720 },
]

const at = (id: string) => NODES.find((n) => n.id === id)!

export function AfricaNetwork() {
  return (
    <svg className="africa-net" viewBox="0 0 1000 1000" role="img" aria-label="Africa registry network">
      <image href="/africa-map.svg" x="0" y="0" width="1000" height="1000" />

      {STARS.map((s, i) => (
        <circle key={`star${i}`} className="map-star" cx={s.x} cy={s.y} r="4" style={{ animationDelay: `${i * 0.35}s` }} />
      ))}

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

      {/* pulses of light travelling country → country */}
      {PULSES.map(([a, b], i) => {
        const p = at(a)
        const q = at(b)
        return (
          <circle key={`p${i}`} className="map-pulse" r="9">
            <animateMotion dur="2.6s" repeatCount="indefinite" begin={`${i * 0.32}s`} calcMode="linear" values={`${p.x},${p.y};${q.x},${q.y}`} />
            <animate attributeName="opacity" dur="2.6s" repeatCount="indefinite" begin={`${i * 0.32}s`} values="0;1;1;0" keyTimes="0;0.12;0.88;1" />
          </circle>
        )
      })}

      {NODES.map((n, i) => (
        <g key={n.id}>
          <circle className="map-node-ring" cx={n.x} cy={n.y} r="15" style={{ animationDelay: `${i * 0.26}s` }} />
          <circle className="map-node-core" cx={n.x} cy={n.y} r="13" />
        </g>
      ))}
    </svg>
  )
}
