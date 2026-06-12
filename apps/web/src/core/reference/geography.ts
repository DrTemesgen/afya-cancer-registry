/**
 * African geography seed — the hierarchy tree.
 *
 * Continental → 5 AU regions → a balanced set of countries across all regions →
 * (for one anchor country per region) a real population-based registry and a teaching
 * hospital, so seed cases and dashboards are meaningful in every region.
 *
 * Registries named here (Ibadan, Gharbiah, Nairobi, Harare, Yaoundé) are well-known
 * African PBCRs; the case data attached in seed.ts is SYNTHETIC.
 */
import type { HierarchyNode } from '../hierarchy'

export const GEOGRAPHY: HierarchyNode[] = [
  // --- continental root ---
  { id: 'africa', type: 'continental', name: 'Africa', parentId: null },

  // --- AU regions ---
  { id: 'reg-northern', type: 'au-region', name: 'Northern Africa', parentId: 'africa', auRegion: 'northern' },
  { id: 'reg-western', type: 'au-region', name: 'Western Africa', parentId: 'africa', auRegion: 'western' },
  { id: 'reg-central', type: 'au-region', name: 'Central Africa', parentId: 'africa', auRegion: 'central' },
  { id: 'reg-eastern', type: 'au-region', name: 'Eastern Africa', parentId: 'africa', auRegion: 'eastern' },
  { id: 'reg-southern', type: 'au-region', name: 'Southern Africa', parentId: 'africa', auRegion: 'southern' },

  // ============ NORTHERN ============
  { id: 'EG', type: 'country', name: 'Egypt', parentId: 'reg-northern', countryIso: 'EG', auRegion: 'northern' },
  { id: 'MA', type: 'country', name: 'Morocco', parentId: 'reg-northern', countryIso: 'MA', auRegion: 'northern' },
  { id: 'DZ', type: 'country', name: 'Algeria', parentId: 'reg-northern', countryIso: 'DZ', auRegion: 'northern' },
  { id: 'EG-GH', type: 'subnational', name: 'Gharbiah Governorate', parentId: 'EG', countryIso: 'EG', auRegion: 'northern', population: 5100000 },
  { id: 'reg-gharbiah', type: 'registry', name: 'Gharbiah Population-based Cancer Registry', parentId: 'EG-GH', countryIso: 'EG', auRegion: 'northern', registryKind: 'population-based' },
  { id: 'fac-tanta', type: 'facility', name: 'Tanta Cancer Centre', parentId: 'reg-gharbiah', countryIso: 'EG', auRegion: 'northern' },

  // ============ WESTERN ============
  { id: 'NG', type: 'country', name: 'Nigeria', parentId: 'reg-western', countryIso: 'NG', auRegion: 'western' },
  { id: 'GH', type: 'country', name: 'Ghana', parentId: 'reg-western', countryIso: 'GH', auRegion: 'western' },
  { id: 'SN', type: 'country', name: 'Senegal', parentId: 'reg-western', countryIso: 'SN', auRegion: 'western' },
  { id: 'NG-OY', type: 'subnational', name: 'Oyo State', parentId: 'NG', countryIso: 'NG', auRegion: 'western', population: 7800000 },
  { id: 'reg-ibadan', type: 'registry', name: 'Ibadan Population-based Cancer Registry', parentId: 'NG-OY', countryIso: 'NG', auRegion: 'western', registryKind: 'population-based' },
  { id: 'fac-uch-ibadan', type: 'facility', name: 'University College Hospital, Ibadan', parentId: 'reg-ibadan', countryIso: 'NG', auRegion: 'western' },

  // ============ CENTRAL ============
  { id: 'CM', type: 'country', name: 'Cameroon', parentId: 'reg-central', countryIso: 'CM', auRegion: 'central' },
  { id: 'CD', type: 'country', name: 'DR Congo', parentId: 'reg-central', countryIso: 'CD', auRegion: 'central' },
  { id: 'GA', type: 'country', name: 'Gabon', parentId: 'reg-central', countryIso: 'GA', auRegion: 'central' },
  { id: 'CM-CE', type: 'subnational', name: 'Centre Region', parentId: 'CM', countryIso: 'CM', auRegion: 'central', population: 4200000 },
  { id: 'reg-yaounde', type: 'registry', name: 'Yaoundé Cancer Registry', parentId: 'CM-CE', countryIso: 'CM', auRegion: 'central', registryKind: 'population-based' },
  { id: 'fac-yaounde-gh', type: 'facility', name: 'Yaoundé General Hospital', parentId: 'reg-yaounde', countryIso: 'CM', auRegion: 'central' },

  // ============ EASTERN ============
  { id: 'KE', type: 'country', name: 'Kenya', parentId: 'reg-eastern', countryIso: 'KE', auRegion: 'eastern' },
  { id: 'ET', type: 'country', name: 'Ethiopia', parentId: 'reg-eastern', countryIso: 'ET', auRegion: 'eastern' },
  { id: 'TZ', type: 'country', name: 'Tanzania', parentId: 'reg-eastern', countryIso: 'TZ', auRegion: 'eastern' },
  { id: 'UG', type: 'country', name: 'Uganda', parentId: 'reg-eastern', countryIso: 'UG', auRegion: 'eastern' },
  { id: 'KE-NB', type: 'subnational', name: 'Nairobi County', parentId: 'KE', countryIso: 'KE', auRegion: 'eastern', population: 4700000 },
  { id: 'reg-nairobi', type: 'registry', name: 'Nairobi Cancer Registry', parentId: 'KE-NB', countryIso: 'KE', auRegion: 'eastern', registryKind: 'population-based' },
  { id: 'fac-knh', type: 'facility', name: 'Kenyatta National Hospital', parentId: 'reg-nairobi', countryIso: 'KE', auRegion: 'eastern' },

  // ============ SOUTHERN ============
  { id: 'ZA', type: 'country', name: 'South Africa', parentId: 'reg-southern', countryIso: 'ZA', auRegion: 'southern' },
  { id: 'ZW', type: 'country', name: 'Zimbabwe', parentId: 'reg-southern', countryIso: 'ZW', auRegion: 'southern' },
  { id: 'NA', type: 'country', name: 'Namibia', parentId: 'reg-southern', countryIso: 'NA', auRegion: 'southern' },
  { id: 'ZW-HA', type: 'subnational', name: 'Harare Province', parentId: 'ZW', countryIso: 'ZW', auRegion: 'southern', population: 2400000 },
  { id: 'reg-harare', type: 'registry', name: 'Zimbabwe National Cancer Registry (Harare)', parentId: 'ZW-HA', countryIso: 'ZW', auRegion: 'southern', registryKind: 'population-based' },
  { id: 'fac-parirenyatwa', type: 'facility', name: 'Parirenyatwa Hospital', parentId: 'reg-harare', countryIso: 'ZW', auRegion: 'southern' },
]

/** The registries that ship with seed cases (one per AU region). */
export const SEED_REGISTRY_IDS = [
  'reg-gharbiah',
  'reg-ibadan',
  'reg-yaounde',
  'reg-nairobi',
  'reg-harare',
] as const
