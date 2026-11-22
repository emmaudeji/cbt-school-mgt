
import { NextRequest, NextResponse } from "next/server"
import { parse } from "csv-parse/sync"
import { Workbook } from "exceljs"

import { createClient } from "@/utils/supabase/server"
import { SCHOOL_SLUG, tables } from "@/constants"

import {
  REGISTRATION_FIELDS,
  validateRegistrations,
  type RegistrationField,
  type RegistrationIssue,
} from "@/features/platform/students/services/registration-fields"

import { registerStudents } from "@/features/platform/students/services/student-registration"

export const runtime = "nodejs"

const MAX_BYTES = 2 * 1024 * 1024
const MAX_ROWS = 300

function respondError(message: string, status = 400) {
  return NextResponse.json(
    { error: message },
    { status }
  )
}

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
}

function cellText(value: unknown): string {
  if (value == null) return ""

  if (value instanceof Date) {
    const year = value.getUTCFullYear()
    const month = String(
      value.getUTCMonth() + 1
    ).padStart(2, "0")
    const day = String(value.getUTCDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  }

  if (typeof value === "object") {
    const cell = value as Record<string, unknown>

    // Do not evaluate spreadsheet formulas.
    if ("formula" in cell || "sharedFormula" in cell) {
      throw new Error(
        "Spreadsheet formulas are not allowed in registration fields."
      )
    }

    if ("text" in cell) {
      return String(cell.text ?? "")
    }

    if ("richText" in cell) {
      return (
        cell.richText as { text: string }[]
      ).map((part) => part.text).join("")
    }

    if ("result" in cell) {
      return String(cell.result ?? "")
    }

    throw new Error("Unsupported spreadsheet cell value.")
  }

  return String(value)
}

async function parseFile(file: File) {
  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase()

  const bytes = Buffer.from(await file.arrayBuffer())

  if (extension === "json") {
    const value: unknown = JSON.parse(
      bytes.toString("utf8")
    )

    const records =
      Array.isArray(value)
        ? value
        : value &&
            typeof value === "object" &&
            "students" in value
          ? (value as { students: unknown }).students
          : null

    if (!Array.isArray(records)) {
      throw new Error(
        "JSON must be an array or an object containing a students array."
      )
    }

    if (
      !records.every(
        (record) =>
          record !== null &&
          typeof record === "object" &&
          !Array.isArray(record)
      )
    ) {
      throw new Error("Every student must be a JSON object.")
    }

    return records as Record<string, unknown>[]
  }

  let headers: string[]
  let values: string[][]

  if (extension === "csv") {
    const data = parse(bytes.toString("utf8"), {
        skip_empty_lines: true,
        bom: true,
        relax_quotes: false,
        relax_column_count: false,
        }) as string[][]

    headers = (data[0] ?? []).map(normalizeHeader)
    values = data.slice(1)
  } else if (extension === "xlsx") {
    const workbook = new Workbook()

    await workbook.xlsx.load(
      bytes as unknown as Parameters<typeof workbook.xlsx.load>[0]
    )

    const sheet = workbook.worksheets[0]

    if (!sheet) {
      throw new Error("The spreadsheet has no worksheet.")
    }

    const headerRow = sheet.getRow(1)

    headers = Array.from(
      { length: headerRow.cellCount },
      (_, index) =>
        normalizeHeader(
          cellText(headerRow.getCell(index + 1).value)
        )
    )

    values = []

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return

      values.push(
        headers.map((_, index) =>
          cellText(row.getCell(index + 1).value)
        )
      )
    })
  } else {
    throw new Error(
      "Only CSV, XLSX and JSON files are supported."
    )
  }

  const allowed = new Set<string>(REGISTRATION_FIELDS)

  const unknownHeaders = headers.filter(
    (header) => header && !allowed.has(header)
  )

  if (unknownHeaders.length) {
    throw new Error(
      `Unknown columns: ${unknownHeaders.join(", ")}`
    )
  }

  if (new Set(headers).size !== headers.length) {
    throw new Error("The file has duplicate column names.")
  }

  if (
    !headers.includes("first_name") ||
    !headers.includes("last_name")
  ) {
    throw new Error(
      "The file must contain first_name and last_name columns."
    )
  }

  const records = values
    .filter((cells) =>
      cells.some((value) => value.trim() !== "")
    )
    .map((cells) =>
      Object.fromEntries(
        headers.map((header, index) => [
          header as RegistrationField,
          cells[index] ?? "",
        ])
      )
    )

  return records
}

export async function GET() {
  const header = REGISTRATION_FIELDS.join(",")

  return new Response(
    `\uFEFF${header}\r\n`,
    {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="student-registration-template.csv"',
        "Cache-Control": "no-store",
      },
    }
  )
}

export async function POST(request: NextRequest) {
  const db = await createClient()

  const { data: auth } = await db.auth.getUser()

  if (!auth.user) {
    return respondError("Please sign in.", 401)
  }

  let form: FormData

  try {
    form = await request.formData()
  } catch {
    return respondError("Invalid upload.")
  }

  const file = form.get("file")
  const mode = form.get("mode")

  if (!(file instanceof File)) {
    return respondError("Choose a registration file.")
  }

  if (file.size === 0 || file.size > MAX_BYTES) {
    return respondError(
        "Choose a non-empty file not exceeding 2 MB."
    )
    }

  if (mode !== "preview" && mode !== "import") {
    return respondError("Invalid import action.")
  }

  try {
    const records = await parseFile(file)

    if (
      records.length < 1 ||
      records.length > MAX_ROWS
    ) {
      return respondError(
        `The file must contain 1–${MAX_ROWS} students.`
      )
    }

    const { rows, issues } =
      validateRegistrations(records)

    // Detect admission numbers already registered.
    // RLS still limits the underlying directory query.
    const admissionNumbers = rows
      .map((row) => row.admission_number)
      .filter(Boolean)

    if (admissionNumbers.length) {
      const { data: org } = await db
        .from(tables.organizations)
        .select("id")
        .eq("slug", SCHOOL_SLUG)
        .eq("type", "school")
        .eq("status", "active")
        .maybeSingle()

      if (!org) {
        return respondError(
          "School information unavailable.",
          403
        )
      }

      const { data: existing, error } = await db
        .from(tables.school_students)
        .select("admission_number")
        .eq("organization_id", org.id)
        .in("admission_number", admissionNumbers)

      if (error) {
        return respondError(error.message, 403)
      }

      const used = new Set(
        (existing ?? []).map((record) =>
          record.admission_number?.toLowerCase()
        )
      )

      rows.forEach((row, index) => {
        if (
          row.admission_number &&
          used.has(row.admission_number.toLowerCase())
        ) {
          issues.push({
            row: index + 2,
            field: "admission_number",
            message: "Admission number already exists.",
          })
        }
      })
    }

    if (mode === "preview") {
      return NextResponse.json({
        count: rows.length,
        valid: issues.length === 0,
        issues: issues.slice(0, 50),
        preview: rows.slice(0, 8).map((row) => ({
          first_name: row.first_name,
          last_name: row.last_name,
          admission_number: row.admission_number,
          guardian_name: [
            row.guardian_first_name,
            row.guardian_last_name,
          ].filter(Boolean).join(" "),
        })),
      })
    }

    if (issues.length) {
      return NextResponse.json(
        {
          error: "Correct the import errors first.",
          issues: issues.slice(0, 50),
        },
        { status: 422 }
      )
    }

    const result = await registerStudents(rows)

    if (result.error || !result.data) {
      return respondError(
        result.error ?? "Registration failed."
      )
    }

    return NextResponse.json({
      count: result.data.count,
      students: result.data.students,
    })
  } catch (error) {
    return respondError(
      error instanceof Error
        ? error.message
        : "Unable to process the file."
    )
  }
}
