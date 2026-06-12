import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSession } from '../state/session'
import { cellsInScope, labelFor, AU_REGIONS, TIER, type HierarchyNode } from '../core'

export function Registries() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { user, access, hierarchy, aggregates } = useSession()

  const scope = access.visibleScope(user!)
  const nodes = useMemo(() => {
    const list = [...scope].map((id) => hierarchy.get(id)!).filter(Boolean)
    // order as a tree: by ancestry-name path
    return list.sort((a, b) => pathOf(hierarchy, a).localeCompare(pathOf(hierarchy, b)))
  }, [scope, hierarchy])

  const home = hierarchy.get(user!.nodeId)!
  const baseTier = TIER[home.type]

  return (
    <div>
      <h1>{t('registries.title')}</h1>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>{t('nav.registries')}</th>
              <th>{t('registries.type')}</th>
              <th>{t('registries.kind')}</th>
              <th>{t('registries.region')}</th>
              <th>{t('registries.population')}</th>
              <th>{t('registries.casesHere')}</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((n) => {
              const indent = Math.max(0, baseTier - TIER[n.type])
              const count = cellsInScope(aggregates, hierarchy, n.id).reduce((s, c) => s + c.count, 0)
              return (
                <tr key={n.id}>
                  <td style={{ paddingInlineStart: 10 + indent * 18 }}>
                    {indent > 0 && <span style={{ color: 'var(--muted)' }}>└ </span>}
                    {n.name}
                  </td>
                  <td><span className="badge">{n.type}</span></td>
                  <td>{n.registryKind ?? '–'}</td>
                  <td>{n.auRegion ? labelFor(AU_REGIONS, n.auRegion, lang) : '–'}</td>
                  <td>{n.population ? n.population.toLocaleString() : '–'}</td>
                  <td>{count.toLocaleString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function pathOf(hierarchy: ReturnType<typeof useSession>['hierarchy'], node: HierarchyNode): string {
  return hierarchy
    .ancestry(node.id)
    .map((n) => n.name)
    .join(' / ')
}
