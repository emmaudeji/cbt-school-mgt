
export const REGISTRATION_FIELDS = [
  "first_name",
  "last_name",
  "other_names",
  "admission_number",
  "date_of_birth",
  "gender",
  "residential_address",
  "previous_school_name",
  "previous_school_address",
  "guardian_first_name",
  "guardian_last_name",
  "guardian_relationship",
  "guardian_phone",
  "guardian_alternate_phone",
  "guardian_email",
  "guardian_address",
  "guardian_occupation",
] as const

export type RegistrationField =
  (typeof REGISTRATION_FIELDS)[number]

export type RegistrationRow = Record<
  RegistrationField,
  string
>

export type RegistrationIssue = {
  row: number
  field: string
  message: string
}

export const EMPTY_REGISTRATION: RegistrationRow =
  Object.fromEntries(
    REGISTRATION_FIELDS.map((field) => [field, ""])
  ) as RegistrationRow

export function validateRegistrations(
  source: Record<string, unknown>[]
) {
  const rows: RegistrationRow[] = []
  const issues: RegistrationIssue[] = []
  const admissionNumbers = new Set<string>()

  source.forEach((record, index) => {
    const rowNumber = index + 2
    const row = { ...EMPTY_REGISTRATION }

    for (const field of REGISTRATION_FIELDS) {
      const value = record[field]

      row[field] =
        value == null ? "" : String(value).trim()
    }

    row.gender = row.gender.toLowerCase()

    if (!row.first_name || !row.last_name) {
      issues.push({
        row: rowNumber,
        field: "name",
        message: "First and last names are required.",
      })
    }

    if (
      row.first_name.length > 100 ||
      row.last_name.length > 100
    ) {
      issues.push({
        row: rowNumber,
        field: "name",
        message: "Names must not exceed 100 characters.",
      })
    }

    if (
      row.gender &&
      !["male", "female", "other"].includes(row.gender)
    ) {
      issues.push({
        row: rowNumber,
        field: "gender",
        message: "Use male, female or other.",
      })
    }

    if (row.date_of_birth) {
      const date = row.date_of_birth

      const validFormat = /^\d{4}-\d{2}-\d{2}$/.test(date)
      const parsed = new Date(`${date}T00:00:00Z`)

      const validDate =
        validFormat &&
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === date &&
        date <= new Date().toISOString().slice(0, 10)

      if (!validDate) {
        issues.push({
          row: rowNumber,
          field: "date_of_birth",
          message: "Use a valid past date (YYYY-MM-DD).",
        })
      }
    }

    if (
      Boolean(row.guardian_first_name) !==
      Boolean(row.guardian_last_name)
    ) {
      issues.push({
        row: rowNumber,
        field: "guardian",
        message: "Provide both guardian names.",
      })
    }

    if (
      !row.guardian_first_name &&
      !row.guardian_last_name &&
      [
        row.guardian_relationship,
        row.guardian_phone,
        row.guardian_alternate_phone,
        row.guardian_email,
        row.guardian_address,
        row.guardian_occupation,
      ].some(Boolean)
    ) {
      issues.push({
        row: rowNumber,
        field: "guardian",
        message: "Guardian names are required when contact details are given.",
      })
    }

    if (
      row.guardian_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        row.guardian_email
      )
    ) {
      issues.push({
        row: rowNumber,
        field: "guardian_email",
        message: "Invalid guardian email address.",
      })
    }

    if (row.admission_number) {
      const admission = row.admission_number.toLowerCase()

      if (admissionNumbers.has(admission)) {
        issues.push({
          row: rowNumber,
          field: "admission_number",
          message: "Duplicate admission number in file.",
        })
      }

      admissionNumbers.add(admission)
    }

    rows.push(row)
  })

  return { rows, issues }
}
