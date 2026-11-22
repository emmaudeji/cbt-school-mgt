
"use server"

import { revalidatePath } from "next/cache"

import { getStaffContext } from "@/services/auth"
import { urls } from "@/constants"

import { getAcademicSetupData } from "./queries"
import {
  inspectAcademicCsv,
} from "./academic-template"

async function getSelectedPeriod(
  sessionId: string,
  termId: string
) {
  const data = await getAcademicSetupData()

  if (!data) return null

  const session = data.sessions.find(
    (item) => item.id === sessionId
  )

  const term = data.terms.find(
    (item) =>
      item.id === termId &&
      item.session_id === sessionId
  )

  return session && term
    ? { session, term }
    : null
}

export async function previewAcademicTemplate(
  formData: FormData
) {
  const file = formData.get("file")
  const sessionId = String(
    formData.get("sessionId") ?? ""
  )
  const termId = String(
    formData.get("termId") ?? ""
  )

  const period = await getSelectedPeriod(
    sessionId,
    termId
  )

  if (!period || !(file instanceof File)) {
    return {
      ok: false as const,
      errors: ["Choose a valid academic period and CSV file."],
      digest: "",
      additions: {
        offerings: 0,
        components: 0,
        unchanged: 0,
      },
      rows: [],
      projected: null,
    }
  }

  return inspectAcademicCsv(
    file,
    sessionId,
    termId,
    period.session.name,
    period.term.name
  )
}

export async function applyAcademicTemplate(
  formData: FormData,
  reviewedDigest: string
): Promise<{
  ok: boolean
  message: string
}> {
  const context = await getStaffContext()

  if (!context) {
    return {
      ok: false,
      message: "Please sign in.",
    }
  }

  const preview = await previewAcademicTemplate(
    formData
  )

  if (!preview.ok) {
    return {
      ok: false,
      message:
        preview.errors[0] ??
        "Please correct the template and preview again.",
    }
  }

  if (
    !reviewedDigest ||
    preview.digest !== reviewedDigest
  ) {
    return {
      ok: false,
      message:
        "The uploaded file has changed. Preview it again before saving.",
    }
  }

  const sessionId = String(
    formData.get("sessionId") ?? ""
  )
  const termId = String(
    formData.get("termId") ?? ""
  )

  const { data, error } =
    await context.supabase.rpc(
      "school_setup_import_academic_csv",
      {
        p_session_id: sessionId,
        p_term_id: termId,
        p_rows: preview.rows,
      }
    )

  if (error) {
    console.error(
      "[SCHOOL:ACADEMIC_TEMPLATE_IMPORT]",
      error
    )

    return {
      ok: false,
      message:
        error.code === "42501"
          ? "You do not have permission to apply this setup."
          : "The setup could not be saved. Review the file and existing school records.",
    }
  }

  if (!data?.ok) {
    return {
      ok: false,
      message: "The academic setup was not saved.",
    }
  }

  revalidatePath(urls.schoolAcademicSetup)

  return {
    ok: true,
    message:
      `${data.created_offerings} subject offering(s) and ` +
      `${data.created_components} assessment component(s) added.`,
  }
}
