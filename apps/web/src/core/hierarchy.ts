/**
 * The federated hierarchy: Facility → Registry → Sub-national → Country → AU Region → Continental.
 * A user is bound to one node; their data scope is that node and everything beneath it
 * (subject to the PHI boundary enforced in rbac.ts).
 */
import type { AuRegionKey } from './types'

export type NodeType =
  | 'continental'
  | 'au-region'
  | 'country'
  | 'subnational'
  | 'registry'
  | 'facility'

export interface HierarchyNode {
  id: string
  type: NodeType
  name: string
  parentId: string | null
  countryIso?: string
  auRegion?: AuRegionKey
  /** Registry kind, when type === 'registry'. */
  registryKind?: 'population-based' | 'hospital-based'
  /** Population denominator (for incidence rates), when known — on subnational/country nodes. */
  population?: number
}

/** Tier ranking, 1 = facility … 6 = continental. */
export const TIER: Record<NodeType, number> = {
  facility: 1,
  registry: 2,
  subnational: 3,
  country: 4,
  'au-region': 5,
  continental: 6,
}

export class Hierarchy {
  private byId = new Map<string, HierarchyNode>()
  private children = new Map<string, string[]>()

  constructor(nodes: HierarchyNode[]) {
    for (const n of nodes) this.byId.set(n.id, n)
    for (const n of nodes) {
      if (n.parentId) {
        const list = this.children.get(n.parentId) ?? []
        list.push(n.id)
        this.children.set(n.parentId, list)
      }
    }
  }

  get(id: string): HierarchyNode | undefined {
    return this.byId.get(id)
  }

  all(): HierarchyNode[] {
    return [...this.byId.values()]
  }

  childrenOf(id: string): HierarchyNode[] {
    return (this.children.get(id) ?? []).map((c) => this.byId.get(c)!).filter(Boolean)
  }

  /** The node and every descendant id (the user's data scope). */
  descendants(id: string): Set<string> {
    const out = new Set<string>([id])
    const stack = [id]
    while (stack.length) {
      const cur = stack.pop()!
      for (const c of this.children.get(cur) ?? []) {
        if (!out.has(c)) {
          out.add(c)
          stack.push(c)
        }
      }
    }
    return out
  }

  /** Path from the root down to the node (for breadcrumbs). */
  ancestry(id: string): HierarchyNode[] {
    const path: HierarchyNode[] = []
    let cur = this.byId.get(id)
    while (cur) {
      path.unshift(cur)
      cur = cur.parentId ? this.byId.get(cur.parentId) : undefined
    }
    return path
  }

  nodesOfType(type: NodeType): HierarchyNode[] {
    return this.all().filter((n) => n.type === type)
  }

  /** Sum the population denominators of the subnational nodes within a scope. */
  populationWithin(id: string): number {
    const scope = this.descendants(id)
    let total = 0
    for (const nid of scope) {
      const n = this.byId.get(nid)
      if (n?.type === 'subnational' && n.population) total += n.population
    }
    return total
  }
}
