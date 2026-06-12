/**
 * Role-based access control. Access = role (what you may do) × hierarchy node (where you
 * sit). The central rule: identifiable case-level data is visible only at the facility /
 * registry tier; everyone above sees de-identified aggregates only.
 * See ../../docs/ACCESS-CONTROL.md.
 */
import type { CaseRecord } from './types'
import { Hierarchy, TIER, type HierarchyNode } from './hierarchy'

export type Role =
  | 'data-entry'
  | 'registrar'
  | 'registry-manager'
  | 'subnational-coordinator'
  | 'national-focal-point'
  | 'regional-coordinator'
  | 'continental-admin'
  | 'researcher'
  | 'auditor'

export interface User {
  id: string
  name: string
  role: Role
  /** The hierarchy node this user is bound to. */
  nodeId: string
  /** For researchers: an approved agreement granting de-identified record access. */
  deidentifiedAccess?: boolean
}

export const ROLE_KEYS: Role[] = [
  'data-entry',
  'registrar',
  'registry-manager',
  'subnational-coordinator',
  'national-focal-point',
  'regional-coordinator',
  'continental-admin',
  'researcher',
  'auditor',
]

const CASE_LEVEL_ROLES: Role[] = ['data-entry', 'registrar', 'registry-manager']
const WRITE_ROLES: Role[] = ['data-entry', 'registrar', 'registry-manager']
const VERIFY_ROLES: Role[] = ['registrar', 'registry-manager']
const MANAGE_ROLES: Role[] = ['registry-manager', 'continental-admin']

export class AccessController {
  constructor(private hierarchy: Hierarchy) {}

  /** The set of node ids the user may see data for (their node + descendants). */
  visibleScope(user: User): Set<string> {
    return this.hierarchy.descendants(user.nodeId)
  }

  /** Can this user ever see identifiable case-level records? (facility/registry tier only) */
  canViewCaseLevel(user: User): boolean {
    if (!CASE_LEVEL_ROLES.includes(user.role)) return false
    const node = this.hierarchy.get(user.nodeId)
    return !!node && TIER[node.type] <= TIER.registry
  }

  /** Tier 3+ and unprivileged researchers see aggregates only. */
  aggregatesOnly(user: User): boolean {
    if (user.role === 'researcher') return !user.deidentifiedAccess
    return !this.canViewCaseLevel(user)
  }

  canVerify(user: User): boolean {
    return VERIFY_ROLES.includes(user.role) && this.canViewCaseLevel(user)
  }

  canManage(user: User): boolean {
    return MANAGE_ROLES.includes(user.role)
  }

  /** May the user create/edit this record? Role allows write AND record is in scope. */
  canEdit(user: User, record: Pick<CaseRecord, 'facilityNodeId' | 'registryNodeId' | 'status'>): boolean {
    if (!WRITE_ROLES.includes(user.role)) return false
    if (record.status === 'verified' && user.role === 'data-entry') return false
    const scope = this.visibleScope(user)
    return scope.has(record.facilityNodeId) || scope.has(record.registryNodeId)
  }

  /** Is a given record within the user's data scope at all? */
  inScope(user: User, record: Pick<CaseRecord, 'facilityNodeId' | 'registryNodeId' | 'subnationalNodeId' | 'countryIso'>): boolean {
    const scope = this.visibleScope(user)
    return (
      scope.has(record.facilityNodeId) ||
      scope.has(record.registryNodeId) ||
      (record.subnationalNodeId ? scope.has(record.subnationalNodeId) : false) ||
      scope.has(record.countryIso)
    )
  }

  /** The node the user is bound to. */
  homeNode(user: User): HierarchyNode | undefined {
    return this.hierarchy.get(user.nodeId)
  }
}

/**
 * De-identify a case record for researcher export: drop direct identifiers, generalise
 * dates to year and residence to region. (k-anonymity review is a deploy-time step.)
 */
export function deidentify(record: CaseRecord): Partial<CaseRecord> {
  const yearOnly = (d?: string) => (d ? d.slice(0, 4) : undefined)
  return {
    type: 'case',
    patientId: `anon-${hashId(record.patientId)}`,
    sex: record.sex,
    ageAtIncidence: record.ageAtIncidence,
    incidenceDate: yearOnly(record.incidenceDate),
    topographyIcdO3: record.topographyIcdO3,
    morphologyIcdO3: record.morphologyIcdO3,
    behaviour: record.behaviour,
    grade: record.grade,
    basisOfDiagnosis: record.basisOfDiagnosis,
    stageSystem: record.stageSystem,
    stageValue: record.stageValue,
    countryIso: record.countryIso,
    auRegion: record.auRegion,
    // residence generalised: keep region, drop facility & subnational
  }
}

/** Stable, non-reversible-enough pseudonym for demo de-identification (not crypto-grade). */
function hashId(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0
  }
  return (h >>> 0).toString(36)
}
