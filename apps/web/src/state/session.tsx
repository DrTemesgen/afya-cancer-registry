/**
 * Session & data context: the hierarchy, the access controller, the current demo user,
 * and the offline case store. Higher tiers see aggregates (computed locally from seed
 * data for the demo); facility/registry roles see case-level records.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Hierarchy,
  AccessController,
  CaseStore,
  aggregateCases,
  generateSeedCases,
  GEOGRAPHY,
  type CaseRecord,
  type User,
  type AggregateCell,
} from '../core'

export const DEMO_USERS: User[] = [
  { id: 'u-aisha', name: 'Aisha (Nairobi clerk)', role: 'data-entry', nodeId: 'fac-knh' },
  { id: 'u-kwame', name: 'Kwame (Ibadan registrar)', role: 'registrar', nodeId: 'reg-ibadan' },
  { id: 'u-fatima', name: 'Fatima (Gharbiah manager)', role: 'registry-manager', nodeId: 'reg-gharbiah' },
  { id: 'u-joseph', name: 'Joseph (Kenya MoH)', role: 'national-focal-point', nodeId: 'KE' },
  { id: 'u-amina', name: 'Amina (Eastern Africa hub)', role: 'regional-coordinator', nodeId: 'reg-eastern' },
  { id: 'u-thabo', name: 'Thabo (Continental hub)', role: 'continental-admin', nodeId: 'africa' },
  { id: 'u-sara', name: 'Dr Sara (Researcher)', role: 'researcher', nodeId: 'africa', deidentifiedAccess: true },
]

interface SessionValue {
  hierarchy: Hierarchy
  access: AccessController
  user: User | null
  signIn: (userId: string) => void
  signOut: () => void
  cases: CaseRecord[]
  aggregates: AggregateCell[]
  loading: boolean
  store: CaseStore
  saveCase: (record: CaseRecord) => Promise<void>
  reseed: () => Promise<void>
}

const Ctx = createContext<SessionValue | null>(null)

const USER_KEY = 'afya-acr-user'

export function SessionProvider({ children }: { children: ReactNode }) {
  const hierarchy = useMemo(() => new Hierarchy(GEOGRAPHY), [])
  const access = useMemo(() => new AccessController(hierarchy), [hierarchy])
  const store = useMemo(() => new CaseStore(), [])

  const [user, setUser] = useState<User | null>(() => {
    const id = typeof localStorage !== 'undefined' ? localStorage.getItem(USER_KEY) : null
    return DEMO_USERS.find((u) => u.id === id) ?? null
  })
  const [cases, setCases] = useState<CaseRecord[]>([])
  const [loading, setLoading] = useState(true)

  async function loadOrSeed() {
    setLoading(true)
    let all = await store.all()
    if (all.length === 0) {
      await store.bulkPut(generateSeedCases())
      all = await store.all()
    }
    setCases(all)
    setLoading(false)
  }

  useEffect(() => {
    void loadOrSeed()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const aggregates = useMemo(() => aggregateCases(cases), [cases])

  const value: SessionValue = {
    hierarchy,
    access,
    user,
    signIn: (userId) => {
      const u = DEMO_USERS.find((x) => x.id === userId) ?? null
      setUser(u)
      if (u && typeof localStorage !== 'undefined') localStorage.setItem(USER_KEY, u.id)
    },
    signOut: () => {
      setUser(null)
      if (typeof localStorage !== 'undefined') localStorage.removeItem(USER_KEY)
    },
    cases,
    aggregates,
    loading,
    store,
    saveCase: async (record) => {
      const saved = await store.put(record)
      setCases((prev) => {
        const idx = prev.findIndex((c) => c._id === saved._id)
        if (idx >= 0) {
          const next = prev.slice()
          next[idx] = saved
          return next
        }
        return [saved, ...prev]
      })
    },
    reseed: async () => {
      await store.clear()
      await store.bulkPut(generateSeedCases())
      const all = await store.all()
      setCases(all)
    },
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSession(): SessionValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSession must be used within SessionProvider')
  return v
}
