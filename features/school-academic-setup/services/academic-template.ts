
import "server-only"

import Papa from "papaparse"
import { createHash } from "node:crypto"

import {
  getAssessmentSetupData,
  type AssessmentSetupData,
} from "./assessment-queries"

export const CSV_COLUMNS = [
  "Academic Session",
  "Term",
  "Class",
  "Subject",
  "Assessment",
  "Maximum Marks",
  "Weight (%)",
] as const

const MAX_BYTES = 2 * 1024 * 1024
const MAX_ROWS = 5000

type CsvRow = Record<string, string>

export type ImportRow = {
  class_name: string
  subject_name: string
  assessment_name: string
  maximum_score: number
  weight_percent: number
}

export type AcademicTemplatePreview = {
  ok: boolean
  errors: string[]
  digest: string
  additions: {
    offerings: number
    components: number
    unchanged: number
  }
  rows: ImportRow[]
  projected: AssessmentSetupData | null
}

const emptyPreview = (): AcademicTemplatePreview => ({
  ok: false,
  errors: [],
  digest: "",
  additions: {
    offerings: 0,
    components: 0,
    unchanged: 0,
  },
  rows: [],
  projected: null,
})

const norm = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en")

export function toCsv(rows: CsvRow[]) {
  return Papa.unparse({
    fields: [...CSV_COLUMNS],
    data: rows.map((row) =>
      CSV_COLUMNS.map((column) => row[column] ?? "")
    ),
  })
}



export async function inspectAcademicCsv(
  file: File,
  sessionId: string,
  termId: string,
  sessionName: string,
  termName: string
): Promise<AcademicTemplatePreview> {
  const result = emptyPreview()

  if (
    !(file instanceof File) ||
    file.size === 0 ||
    file.size > MAX_BYTES ||
    !file.name.toLowerCase().endsWith(".csv")
  ) {
    result.errors.push(
      "Choose a CSV template smaller than 2 MB."
    )
    return result
  }

  const data = await getAssessmentSetupData(
    sessionId,
    termId
  )

  if (!data) {
    result.errors.push(
      "Unable to load this academic period."
    )
    return result
  }

  const text = await file.text()

  result.digest = createHash("sha256")
    .update(text)
    .digest("hex")

  const parsed = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) =>
      header.trim().replace(/^\uFEFF/, ""),
  })

  if (parsed.errors.length > 0) {
    result.errors.push(
      "The CSV contains formatting errors. Check quoted cells and separators."
    )
    return result
  }

  const fields = parsed.meta.fields ?? []

  if (!CSV_COLUMNS.every((name) => fields.includes(name))) {
    result.errors.push(
      `Required columns: ${CSV_COLUMNS.join(", ")}`
    )
    return result
  }

  if (parsed.data.length > MAX_ROWS) {
    result.errors.push(
      "This template contains too many rows. Maximum: 5,000."
    )
    return result
  }

  const projected: AssessmentSetupData = {
    ...data,
    classes: [...data.classes],
    subjects: [...data.subjects],
    offerings: [...data.offerings],
    components: [...data.components],
  }

  const classMap = new Map(
    data.classes.map((item) => [norm(item.name), item])
  )

  const subjectMap = new Map(
    data.subjects.map((item) => [norm(item.name), item])
  )

  const offeringMap = new Map<string, string>()

  for (const item of data.offerings) {
    offeringMap.set(
      `${item.class_id}:${item.subject_id}`,
      item.id
    )
  }

  const componentMap = new Map(
    data.components.map((item) => [
      `${item.offering_id}:${norm(item.name)}`,
      item,
    ])
  )

  const seen = new Map<string, string>()

  let newOfferings = 0
  let newComponents = 0
  let unchanged = 0

  const importedRows: ImportRow[] = []

  for (const [index, record] of parsed.data.entries()) {
    const line = index + 2

    const sessionName =
      record["Academic Session"]?.trim() ?? ""

    const termName =
      record["Term"]?.trim() ?? ""

    const className =
      record["Class"]?.trim() ?? ""

    const subjectName =
      record["Subject"]?.trim() ?? ""

    const assessmentName =
      record["Assessment"]?.trim() ?? ""

    const marksText =
      record["Maximum Marks"]?.trim() ?? ""

    const weightText =
      record["Weight (%)"]?.trim() ?? ""

    // Blank subject rows are included in downloads
    // as convenient places to add new assignments.
    if (
      !subjectName &&
      !assessmentName &&
      !marksText &&
      !weightText
    ) {
      continue
    }

    if (
      !className ||
      !subjectName ||
      !assessmentName ||
      !marksText ||
      !weightText
    ) {
      result.errors.push(
        `Row ${line}: Complete the subject, assessment, marks and weight.`
      )
      continue
    }

    
    if (
      norm(sessionName) !== norm(
        record["Academic Session"] ?? ""
      ) ||
      norm(termName) !== norm(
        record["Term"] ?? ""
      )
    ) {
      result.errors.push(
        `Row ${line}: Academic session or term does not match the selected period.`
      )
      continue
    }

    const schoolClass = classMap.get(norm(className))
    const subject = subjectMap.get(norm(subjectName))

    if (!schoolClass || !subject) {
      result.errors.push(
        `Row ${line}: ${
          !schoolClass
            ? `Class "${className}"`
            : `Subject "${subjectName}"`
        } was not found in the school catalogue.`
      )
      continue
    }

    const maximumScore = Number(marksText)
    const weightPercent = Number(weightText)

    if (
      !Number.isFinite(maximumScore) ||
      maximumScore <= 0 ||
      maximumScore > 999999.99 ||
      !Number.isFinite(weightPercent) ||
      weightPercent < 0 ||
      weightPercent > 100 ||
      !/^\d+(\.\d{1,2})?$/.test(marksText) ||
      !/^\d+(\.\d{1,2})?$/.test(weightText)
    ) {
      result.errors.push(
        `Row ${line}: Enter valid marks and a weight between 0 and 100. Use at most two decimal places.`
      )
      continue
    }

    const key =
      `${schoolClass.id}:${subject.id}`

    let offeringId = offeringMap.get(key)

    if (!offeringId) {
      offeringId = `preview-offering-${schoolClass.id}-${subject.id}`
      offeringMap.set(key, offeringId)

      projected.offerings.push({
        id: offeringId,
        class_id: schoolClass.id,
        subject_id: subject.id,
      })

      newOfferings++
    }

    const componentKey =
      `${offeringId}:${norm(assessmentName)}`

    const signature =
      `${maximumScore.toFixed(2)}:${weightPercent.toFixed(2)}`

    if (seen.has(componentKey)) {
      if (seen.get(componentKey) !== signature) {
        result.errors.push(
          `Row ${line}: Conflicting duplicate assessment definition.`
        )
      }
      continue
    }

    seen.set(componentKey, signature)

    const existingComponent =
      componentMap.get(componentKey)

    if (existingComponent) {
      const matches =
        Number(existingComponent.maximum_score) ===
          maximumScore &&
        Number(existingComponent.weight_percent) ===
          weightPercent

      if (!matches) {
        result.errors.push(
          `Row ${line}: "${assessmentName}" already exists with different marks or weight. Edit the CSV to match the school record, or use the authorized assessment editor later.`
        )
        continue
      }

      unchanged++
    } else {
      projected.components.push({
        id: `preview-component-${line}`,
        offering_id: offeringId,
        name: assessmentName,
        position:
          projected.components.filter(
            (item) => item.offering_id === offeringId
          ).length + 1,
        maximum_score: maximumScore,
        weight_percent: weightPercent,
      })

      newComponents++
    }

    importedRows.push({
      class_name: schoolClass.name,
      subject_name: subject.name,
      assessment_name: assessmentName,
      maximum_score: maximumScore,
      weight_percent: weightPercent,
    })
  }

  result.additions = {
    offerings: newOfferings,
    components: newComponents,
    unchanged,
  }

  result.rows = importedRows
  result.projected = projected
  result.ok =
    result.errors.length === 0 &&
    importedRows.length > 0

  if (importedRows.length === 0 && !result.errors.length) {
    result.errors.push(
      "The template has no completed academic assessment rows."
    )
  }

  return result
}
