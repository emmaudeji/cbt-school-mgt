"use server"

import { revalidatePath } from "next/cache"
import { getStaffContext } from "@/services/auth"
import { getExamBySlug } from "@/features/exams/services/queries"

export type SyncActionState = { ok: boolean; message: string; imported: number }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function importExamSchoolScores(
  _previous: SyncActionState,
  formData: FormData
): Promise<SyncActionState> {
  const fail = (message: string): SyncActionState => ({ ok: false, message, imported: 0 })
  const slug = String(formData.get("slug") ?? "")
  const raw = String(formData.get("items") ?? "")
  if (!slug || raw.length > 30000) return fail("Invalid import request.")

  let items: unknown
  try { items = JSON.parse(raw) } catch { return fail("Invalid selection.") }
  if (!Array.isArray(items) || items.length === 0 || items.length > 200 ||
      items.some((x) => !x || typeof x !== "object" ||
        !UUID.test(String(x.link_id)) || !UUID.test(String(x.student_id)))) {
    return fail("Select between 1 and 200 eligible students per batch.")
  }

  try {
    const context = await getStaffContext()
    if (!context) return fail("Sign in to continue.")
    const exam = await getExamBySlug(slug)
    if (!exam || exam.organization_id !== context.organizationId) {
      return fail("Examination is not available to this organization.")
    }
    const { data, error } = await context.supabase.rpc("cbt_school_sync_import", {
      p_exam_id: exam.id,
      p_items: items,
    })
    if (error) {
      console.error("[CBT:SCHOOL_SYNC_IMPORT]", error)
      return fail(error.code === "42501"
        ? "You do not have permission to import school scores."
        : "Scores were not imported. Refresh the preview and check the server logs.")
    }
    if (!data?.ok) return fail("The database did not confirm this import.")
    revalidatePath(`/exams/${encodeURIComponent(slug)}/sync-results`)
    return {
      ok: true,
      imported: Number(data.imported ?? 0),
      message: `${Number(data.imported ?? 0)} school score(s) imported successfully.`,
    }
  } catch (error) {
    console.error("[CBT:SCHOOL_SYNC_IMPORT] Unexpected error", error)
    return fail("Unable to complete this import. No partial batch was committed.")
  }
}
