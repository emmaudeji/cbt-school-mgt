
import { NextRequest, NextResponse } from "next/server"

import { getAcademicSetupData } from
  "@/features/school-academic-setup/services/queries"

import {
  getAssessmentSetupData,
} from "@/features/school-academic-setup/services/assessment-queries"

import {
  toCsv,
} from "@/features/school-academic-setup/services/academic-template"

export async function GET(request: NextRequest) {
  const sessionId =
    request.nextUrl.searchParams.get("session") ?? ""

  const termId =
    request.nextUrl.searchParams.get("term") ?? ""

  const school = await getAcademicSetupData()

  if (!school) {
    return new NextResponse("School unavailable", {
      status: 403,
    })
  }

  const session = school.sessions.find(
    (item) => item.id === sessionId
  )

  const term = school.terms.find(
    (item) =>
      item.id === termId &&
      item.session_id === sessionId
  )

  if (!session || !term) {
    return new NextResponse("Invalid academic period", {
      status: 400,
    })
  }

  const data = await getAssessmentSetupData(
    sessionId,
    termId
  )

  if (!data) {
    return new NextResponse("Unable to load setup data", {
      status: 500,
    })
  }

  const subjectNames = new Map(
    data.subjects.map((item) => [item.id, item.name])
  )

  const rows: Record<string, string>[] = []

  const defaults = [
    { name: "1ST CA", marks: 20, weight: 20 },
    { name: "2ND CA", marks: 20, weight: 20 },
    { name: "FINAL EXAMINATION", marks: 60, weight: 60 },
  ]

  for (const schoolClass of data.classes) {
    const offerings = data.offerings.filter(
      (item) => item.class_id === schoolClass.id
    )

    for (const offering of offerings) {
      const existing = data.components.filter(
        (item) => item.offering_id === offering.id
      )

      const assessments = existing.length
        ? existing.map((item) => ({
            name: item.name,
            marks: item.maximum_score,
            weight: item.weight_percent,
          }))
        : defaults

      for (const assessment of assessments) {
        rows.push({
          "Academic Session": session.name,
          "Term": term.name,
          "Class": schoolClass.name,
          "Subject":
            subjectNames.get(offering.subject_id) ?? "",
          "Assessment": assessment.name,
          "Maximum Marks": String(assessment.marks),
          "Weight (%)": String(assessment.weight),
        })
      }
    }

    // An editable starting row for adding subjects.
    rows.push({
      "Academic Session": session.name,
      "Term": term.name,
      "Class": schoolClass.name,
      "Subject": "",
      "Assessment": "",
      "Maximum Marks": "",
      "Weight (%)": "",
    })
  }

  const csv = toCsv(rows)

  const filename =
    `academic-setup-${session.name.replace("/", "-")}` +
    `-${term.position}.csv`

  return new NextResponse(
    "\uFEFF" + csv,
    {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    }
  )
}
