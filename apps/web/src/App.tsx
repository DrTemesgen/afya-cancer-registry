import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Layout } from './components/Layout'
import { useSession } from './state/session'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { CaseList } from './pages/CaseList'
import { CaseEntry } from './pages/CaseEntry'
import { Registries } from './pages/Registries'
import { Interop } from './pages/Interop'
import { Settings } from './pages/Settings'

export type View =
  | 'dashboard'
  | 'cases'
  | 'newCase'
  | 'editCase'
  | 'registries'
  | 'interop'
  | 'settings'

export default function App() {
  const { t } = useTranslation()
  const { user, loading } = useSession()
  const [view, setView] = useState<View>('dashboard')
  const [editId, setEditId] = useState<string | undefined>()

  function navigate(v: View, id?: string) {
    setEditId(id)
    setView(v)
  }

  if (!user) return <Login />

  return (
    <Layout view={view} navigate={navigate}>
      {loading ? (
        <div className="card">{t('common.loading')}</div>
      ) : (
        renderView(view, editId, navigate)
      )}
    </Layout>
  )
}

function renderView(view: View, editId: string | undefined, navigate: (v: View, id?: string) => void) {
  switch (view) {
    case 'dashboard':
      return <Dashboard />
    case 'cases':
      return <CaseList navigate={navigate} />
    case 'newCase':
      return <CaseEntry navigate={navigate} />
    case 'editCase':
      return <CaseEntry editId={editId} navigate={navigate} />
    case 'registries':
      return <Registries />
    case 'interop':
      return <Interop />
    case 'settings':
      return <Settings />
    default:
      return <Dashboard />
  }
}
