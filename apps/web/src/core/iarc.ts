/**
 * IARC / IACR submission export — the flat case file used for CI5 / GLOBOCAN
 * contributions (the same data flow AFCRN member registries already use).
 * One row per tumour with the core variables. PHI is excluded (pseudonymous id only).
 * See ../../docs/INTEROPERABILITY.md §3.
 */
import type { CaseRecord } from './types'

export const IARC_COLUMNS = [
  'registry',
  'patient_id',
  'sex',
  'birth_date',
  'age',
  'incidence_date',
  'topography',
  'morphology',
  'behaviour',
  'grade',
  'basis',
  'stage_system',
  'stage',
  'vital_status',
  'last_contact',
] as const

function row(c: CaseRecord): (string | number)[] {
  return [
    c.registryNodeId,
    c.patientId,
    c.sex,
    c.dateOfBirth ?? '',
    c.ageAtIncidence ?? '',
    c.incidenceDate,
    c.topographyIcdO3,
    c.morphologyIcdO3,
    c.behaviour,
    c.grade ?? '',
    c.basisOfDiagnosis,
    c.stageSystem ?? '',
    c.stageValue ?? '',
    c.vitalStatus ?? '',
    c.dateOfLastContact ?? '',
  ]
}

function csvField(v: string | number): string {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Produce the IARC submission file as CSV text. */
export function toIarcSubmission(cases: CaseRecord[]): string {
  const lines = [IARC_COLUMNS.join(',')]
  for (const c of cases) lines.push(row(c).map(csvField).join(','))
  return lines.join('\n')
}
