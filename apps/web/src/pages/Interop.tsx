import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSession } from '../state/session'
import {
  toFhirBundle,
  toDhis2DataValueSet,
  toIarcSubmission,
  cellsInScope,
  icdo3,
  type Dhis2Mapping,
  type CaseRecord,
} from '../core'

export function Interop() {
  const { t } = useTranslation()
  const { user, access, hierarchy, cases, aggregates } = useSession()
  const canCase = access.canViewCaseLevel(user!)

  const scopedCases = useMemo(
    () => (canCase ? cases.filter((c) => access.inScope(user!, c)) : []),
    [cases, canCase, access, user],
  )
  const scopedCells = useMemo(
    () => cellsInScope(aggregates, hierarchy, user!.nodeId),
    [aggregates, hierarchy, user],
  )

  const [selectedId, setSelectedId] = useState(scopedCases[0]?._id ?? '')
  const [preview, setPreview] = useState('')
  const [filename, setFilename] = useState('export.txt')
  const [copied, setCopied] = useState(false)

  function show(text: string, name: string) {
    setPreview(text)
    setFilename(name)
    setCopied(false)
  }

  function exportFhir() {
    const c = scopedCases.find((x) => x._id === selectedId)
    if (!c) return
    show(JSON.stringify(toFhirBundle(c), null, 2), `fhir-mcode-${c.tumourId}.json`)
  }

  function exportDhis2() {
    show(JSON.stringify(toDhis2DataValueSet(scopedCells, demoMapping(scopedCells)), null, 2), 'dhis2-datavalueset.json')
  }

  function exportIarc() {
    show(toIarcSubmission(scopedCases.filter((c) => c.status === 'verified')), 'iarc-submission.csv')
  }

  function download() {
    const blob = new Blob([preview], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(preview)
      setCopied(true)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div>
      <h1>{t('interop.title')}</h1>
      <p className="sub">{t('interop.subtitle')}</p>

      <div className="grid cols-3">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{t('interop.fhir')}</h2>
          <p className="sub">{t('interop.fhirDesc')}</p>
          {canCase ? (
            <>
              <div className="field" style={{ marginBottom: 10 }}>
                <label>{t('interop.selectCase')}</label>
                <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                  {scopedCases.slice(0, 200).map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.patientId} · {c.topographyIcdO3} {labelOf(c)}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn" onClick={exportFhir}>{t('common.export')}</button>
            </>
          ) : (
            <div className="notice warn">{t('cases.restricted')}</div>
          )}
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>{t('interop.dhis2')}</h2>
          <p className="sub">{t('interop.dhis2Desc')}</p>
          <button className="btn" onClick={exportDhis2}>{t('common.export')}</button>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>{t('interop.iarc')}</h2>
          <p className="sub">{t('interop.iarcDesc')}</p>
          {canCase ? (
            <button className="btn" onClick={exportIarc}>{t('common.export')}</button>
          ) : (
            <div className="notice warn">{t('cases.restricted')}</div>
          )}
        </div>
      </div>

      {preview && (
        <>
          <div className="toolbar">
            <button className="btn secondary" onClick={download}>{t('common.download')} · {filename}</button>
            <button className="btn secondary" onClick={copy}>{copied ? t('interop.copied') : t('interop.copy')}</button>
          </div>
          <h2>{t('interop.preview')}</h2>
          <pre className="codeblock">{preview.length > 20000 ? preview.slice(0, 20000) + '\n…' : preview}</pre>
        </>
      )}
    </div>
  )
}

function labelOf(c: CaseRecord): string {
  return icdo3.topographyEntry(c.topographyIcdO3)?.term ?? ''
}

/** Build a demo DHIS2 mapping from the cells present (production maps to real DHIS2 ids). */
function demoMapping(cells: { registryNodeId: string; countryIso: string; topographyGroup: string }[]): Dhis2Mapping {
  const orgUnit: Record<string, string> = {}
  const dataElement: Record<string, string> = {}
  for (const c of cells) {
    orgUnit[c.registryNodeId] = `OU-${c.registryNodeId}`
    orgUnit[c.countryIso] = `OU-${c.countryIso}`
    dataElement[c.topographyGroup] = `DE-${c.topographyGroup}`
  }
  return {
    orgUnit,
    dataElement,
    categoryOptionCombo: { 1: 'COC-male', 2: 'COC-female', 3: 'COC-other', 9: 'COC-unknown' },
    defaultOrgUnit: 'OU-default',
  }
}
