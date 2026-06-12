/**
 * HL7 FHIR R4 + mCODE mapping.
 *
 * toFhirBundle()   — a CaseRecord → a FHIR transaction Bundle whose entries follow the
 *                    mCODE profiles (CancerPatient, PrimaryCancerCondition, TNMStageGroup,
 *                    HistologyMorphologyBehavior, CancerRelated*Procedure, …).
 * fromFhirBundle() — best-effort ingest of an mCODE bundle from an EHR back into the model.
 *
 * Codes use ICD-O-3 (system http://terminology.hl7.org/CodeSystem/icd-o-3) for site &
 * morphology, mirroring how mCODE carries oncology coding. See ../../docs/INTEROPERABILITY.md.
 */
import type { CaseRecord, TreatmentType } from './types'
import { topographyEntry, morphologyEntry, icdO3ToIcd10 } from './reference/icdo3'

const ICDO3 = 'http://terminology.hl7.org/CodeSystem/icd-o-3'
const ICD10 = 'http://hl7.org/fhir/sid/icd-10'
const MCODE = 'http://hl7.org/fhir/us/mcode/StructureDefinition'

type FhirResource = Record<string, unknown>

const SEX_TO_FHIR: Record<number, string> = { 1: 'male', 2: 'female', 3: 'other', 9: 'unknown' }
const SURGICAL: TreatmentType[] = ['surgery']
const RADIATION: TreatmentType[] = ['radiotherapy']
const MEDICATION: TreatmentType[] = ['chemotherapy', 'hormone', 'immunotherapy', 'targeted']

export function toFhirBundle(c: CaseRecord): FhirResource {
  const patientRef = `urn:uuid:patient-${c.patientId}`
  const conditionRef = `urn:uuid:condition-${c.tumourId}`
  const entries: FhirResource[] = []

  // mCODE CancerPatient
  entries.push(
    entry(patientRef, {
      resourceType: 'Patient',
      meta: { profile: [`${MCODE}/mcode-cancer-patient`] },
      identifier: [{ system: 'urn:afya-acr:patient', value: c.patientId }],
      gender: SEX_TO_FHIR[c.sex] ?? 'unknown',
      birthDate: c.dateOfBirth, // year-precision in synced data
      deceasedBoolean: c.vitalStatus === 2 ? true : undefined,
    }),
  )

  // mCODE PrimaryCancerCondition
  const topo = topographyEntry(c.topographyIcdO3)
  const morph = morphologyEntry(c.morphologyIcdO3)
  entries.push(
    entry(conditionRef, {
      resourceType: 'Condition',
      meta: { profile: [`${MCODE}/mcode-primary-cancer-condition`] },
      subject: { reference: patientRef },
      code: {
        coding: [
          { system: ICDO3, code: c.morphologyIcdO3, display: morph?.term },
          { system: ICD10, code: icdO3ToIcd10(c.topographyIcdO3, c.morphologyIcdO3) },
        ],
      },
      bodySite: [{ coding: [{ system: ICDO3, code: c.topographyIcdO3, display: topo?.term }] }],
      onsetDateTime: c.incidenceDate,
    }),
  )

  // mCODE HistologyMorphologyBehavior
  entries.push(
    entry(`urn:uuid:histology-${c.tumourId}`, {
      resourceType: 'Observation',
      meta: { profile: [`${MCODE}/mcode-histology-morphology-behavior`] },
      status: 'final',
      code: { coding: [{ system: 'http://loinc.org', code: '59847-4', display: 'Histology and behavior ICD-O-3' }] },
      subject: { reference: patientRef },
      focus: [{ reference: conditionRef }],
      valueCodeableConcept: { coding: [{ system: ICDO3, code: `${c.morphologyIcdO3}/${c.behaviour}`, display: morph?.term }] },
    }),
  )

  // mCODE TNMStageGroup / stage
  if (c.stageValue) {
    entries.push(
      entry(`urn:uuid:stage-${c.tumourId}`, {
        resourceType: 'Observation',
        meta: { profile: [`${MCODE}/mcode-tnm-stage-group`] },
        status: 'final',
        code: { coding: [{ system: 'http://loinc.org', code: '21908-9', display: 'Stage group' }] },
        subject: { reference: patientRef },
        focus: [{ reference: conditionRef }],
        valueCodeableConcept: { text: `${c.stageSystem ?? 'stage'}: ${c.stageValue}` },
      }),
    )
  }

  // Treatments → mCODE procedures / medication statements
  for (const [i, t] of (c.treatments ?? []).entries()) {
    if (SURGICAL.includes(t.type)) {
      entries.push(procedure(`urn:uuid:surg-${c.tumourId}-${i}`, patientRef, conditionRef, 'cancer-related-surgical-procedure', t.type, t.date))
    } else if (RADIATION.includes(t.type)) {
      entries.push(procedure(`urn:uuid:rad-${c.tumourId}-${i}`, patientRef, conditionRef, 'cancer-related-radiation-procedure', t.type, t.date))
    } else if (MEDICATION.includes(t.type)) {
      entries.push(
        entry(`urn:uuid:med-${c.tumourId}-${i}`, {
          resourceType: 'MedicationStatement',
          meta: { profile: [`${MCODE}/mcode-cancer-related-medication-statement`] },
          status: 'unknown',
          subject: { reference: patientRef },
          reasonReference: [{ reference: conditionRef }],
          medicationCodeableConcept: { text: t.type },
          effectiveDateTime: t.date,
        }),
      )
    }
  }

  return {
    resourceType: 'Bundle',
    type: 'transaction',
    entry: entries,
  }
}

function entry(fullUrl: string, resource: FhirResource): FhirResource {
  return { fullUrl, resource }
}

function procedure(
  fullUrl: string,
  patientRef: string,
  conditionRef: string,
  profile: string,
  display: string,
  date?: string,
): FhirResource {
  return entry(fullUrl, {
    resourceType: 'Procedure',
    meta: { profile: [`${MCODE}/mcode-${profile}`] },
    status: 'completed',
    subject: { reference: patientRef },
    reasonReference: [{ reference: conditionRef }],
    code: { text: display },
    performedDateTime: date,
  })
}

/** Best-effort ingest of an mCODE bundle into a partial CaseRecord (EHR → registry). */
export function fromFhirBundle(bundle: FhirResource): Partial<CaseRecord> {
  const entries = (bundle.entry as FhirResource[] | undefined) ?? []
  const out: Partial<CaseRecord> = { type: 'case' }
  for (const e of entries) {
    const res = (e.resource ?? {}) as Record<string, any>
    if (res.resourceType === 'Patient') {
      out.sex = fhirGenderToSex(res.gender)
      out.dateOfBirth = res.birthDate
      out.patientId = res.identifier?.[0]?.value ?? out.patientId
      if (res.deceasedBoolean === true) out.vitalStatus = 2
    }
    if (res.resourceType === 'Condition') {
      const site = res.bodySite?.[0]?.coding?.find((x: any) => x.system === ICDO3)?.code
      const morph = res.code?.coding?.find((x: any) => x.system === ICDO3)?.code
      if (site) out.topographyIcdO3 = site
      if (morph) out.morphologyIcdO3 = String(morph).split('/')[0]
      if (res.onsetDateTime) out.incidenceDate = res.onsetDateTime
    }
  }
  return out
}

function fhirGenderToSex(g?: string): CaseRecord['sex'] {
  switch (g) {
    case 'male':
      return 1
    case 'female':
      return 2
    case 'other':
      return 3
    default:
      return 9
  }
}
