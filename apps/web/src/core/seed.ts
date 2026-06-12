/**
 * Synthetic seed-data generator. Produces SYNTHETIC cancer cases (NO real patients) for
 * the five anchor registries — one per AU region — so dashboards, validation, RBAC and
 * exports are immediately explorable. Deterministic (seeded PRNG) for reproducibility.
 *
 * Site mix is weighted toward cancers prominent in African registries (breast, cervix,
 * prostate, liver/HCC, Kaposi sarcoma, oesophagus, NHL incl. Burkitt).
 */
import type { CaseRecord, SexCode, BasisOfDiagnosisCode, StageSystem } from './types'

interface RegistryContext {
  registryNodeId: string
  facilityNodeId: string
  subnationalNodeId: string
  countryIso: string
  auRegion: CaseRecord['auRegion']
}

const REGISTRY_CONTEXTS: RegistryContext[] = [
  { registryNodeId: 'reg-gharbiah', facilityNodeId: 'fac-tanta', subnationalNodeId: 'EG-GH', countryIso: 'EG', auRegion: 'northern' },
  { registryNodeId: 'reg-ibadan', facilityNodeId: 'fac-uch-ibadan', subnationalNodeId: 'NG-OY', countryIso: 'NG', auRegion: 'western' },
  { registryNodeId: 'reg-yaounde', facilityNodeId: 'fac-yaounde-gh', subnationalNodeId: 'CM-CE', countryIso: 'CM', auRegion: 'central' },
  { registryNodeId: 'reg-nairobi', facilityNodeId: 'fac-knh', subnationalNodeId: 'KE-NB', countryIso: 'KE', auRegion: 'eastern' },
  { registryNodeId: 'reg-harare', facilityNodeId: 'fac-parirenyatwa', subnationalNodeId: 'ZW-HA', countryIso: 'ZW', auRegion: 'southern' },
]

interface SiteProfile {
  topo: string
  morph: string
  weight: number
  sexes: SexCode[]
  ageMin: number
  ageMax: number
}

const PROFILES: SiteProfile[] = [
  { topo: 'C50', morph: '8500', weight: 22, sexes: [2, 2, 2, 2, 1], ageMin: 30, ageMax: 75 }, // breast
  { topo: 'C53', morph: '8070', weight: 18, sexes: [2], ageMin: 28, ageMax: 68 }, // cervix
  { topo: 'C61', morph: '8140', weight: 14, sexes: [1], ageMin: 52, ageMax: 85 }, // prostate
  { topo: 'C22', morph: '8170', weight: 9, sexes: [1, 1, 2], ageMin: 35, ageMax: 72 }, // liver (HCC)
  { topo: 'C44', morph: '9140', weight: 7, sexes: [1, 2], ageMin: 24, ageMax: 58 }, // Kaposi sarcoma
  { topo: 'C15', morph: '8070', weight: 7, sexes: [1, 2], ageMin: 40, ageMax: 78 }, // oesophagus
  { topo: 'C77', morph: '9680', weight: 6, sexes: [1, 2], ageMin: 20, ageMax: 70 }, // DLBCL
  { topo: 'C77', morph: '9687', weight: 4, sexes: [1, 1, 2], ageMin: 3, ageMax: 14 }, // Burkitt (paediatric)
  { topo: 'C18', morph: '8140', weight: 7, sexes: [1, 2], ageMin: 38, ageMax: 78 }, // colon
  { topo: 'C16', morph: '8140', weight: 6, sexes: [1, 2], ageMin: 40, ageMax: 78 }, // stomach
]

// mulberry32 — small deterministic PRNG so seed data is stable across runs & tests.
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rnd: () => number, arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)]
}

function weightedProfile(rnd: () => number): SiteProfile {
  const total = PROFILES.reduce((s, p) => s + p.weight, 0)
  let r = rnd() * total
  for (const p of PROFILES) {
    r -= p.weight
    if (r <= 0) return p
  }
  return PROFILES[0]
}

const YEARS = [2020, 2021, 2022, 2023]

function makeBasis(rnd: () => number): BasisOfDiagnosisCode {
  const r = rnd()
  if (r < 0.62) return 7 // histology of primary
  if (r < 0.74) return 5 // cytology
  if (r < 0.86) return 1 // clinical
  if (r < 0.93) return 2 // clinical investigation
  if (r < 0.97) return 0 // DCO
  return 9 // unknown
}

function makeStage(rnd: () => number): { system: StageSystem; value: string } {
  // late-stage presentation is common; bias toward III/IV
  const stage = pick(rnd, ['I', 'II', 'II', 'III', 'III', 'III', 'IV', 'IV'])
  const system = pick(rnd, ['essential-tnm', 'summary', 'essential-tnm'] as StageSystem[])
  return { system, value: stage }
}

/** Generate the full synthetic seed set across all five registries. */
export function generateSeedCases(perRegistry = 80): CaseRecord[] {
  const out: CaseRecord[] = []
  REGISTRY_CONTEXTS.forEach((ctx, ri) => {
    const rnd = mulberry32(1000 + ri)
    for (let i = 0; i < perRegistry; i++) {
      const profile = weightedProfile(rnd)
      const sex = pick(rnd, profile.sexes)
      const age = Math.floor(profile.ageMin + rnd() * (profile.ageMax - profile.ageMin))
      const year = pick(rnd, YEARS)
      const month = String(1 + Math.floor(rnd() * 12)).padStart(2, '0')
      let basis = makeBasis(rnd)
      let morph = profile.morph

      // DCO cases: unspecified morphology, deceased (keeps consistency checks happy)
      let vitalStatus: CaseRecord['vitalStatus'] = rnd() < 0.35 ? 2 : 1
      if (basis === 0) {
        morph = '8000'
        vitalStatus = 2
      }

      const stage = makeStage(rnd)
      const id = `${ctx.registryNodeId}-${year}-${String(i).padStart(4, '0')}`

      const treatments: CaseRecord['treatments'] =
        basis >= 5 && rnd() < 0.7
          ? [{ type: pick(rnd, ['surgery', 'chemotherapy', 'radiotherapy', 'palliative']), intent: rnd() < 0.5 ? 'curative' : 'palliative' }]
          : undefined

      out.push({
        _id: `case:${id}`,
        type: 'case',
        patientId: `P-${ctx.countryIso}-${String(ri * 1000 + i).padStart(5, '0')}`,
        sex,
        dateOfBirth: String(year - age),
        ageAtIncidence: age,
        tumourId: `T-${id}`,
        incidenceDate: `${year}-${month}`,
        topographyIcdO3: profile.topo,
        morphologyIcdO3: morph,
        behaviour: 3,
        basisOfDiagnosis: basis,
        stageSystem: stage.system,
        stageValue: stage.value,
        vitalStatus,
        treatments,
        facilityNodeId: ctx.facilityNodeId,
        registryNodeId: ctx.registryNodeId,
        subnationalNodeId: ctx.subnationalNodeId,
        countryIso: ctx.countryIso,
        auRegion: ctx.auRegion,
        status: i % 9 === 0 ? 'complete' : 'verified',
        createdBy: 'seed',
        createdAt: `${year}-${month}-15T09:00:00.000Z`,
        verifiedAt: i % 9 === 0 ? undefined : `${year}-${month}-20T09:00:00.000Z`,
        verifiedBy: i % 9 === 0 ? undefined : 'seed-registrar',
      })
    }
  })
  return out
}
