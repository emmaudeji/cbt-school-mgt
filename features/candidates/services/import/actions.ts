"use server"

import { revalidatePath } from "next/cache"
import type { CandidateImportValue, CodePreview, ImportResult } from "./types"
import { getStaffContext } from "@/services/auth";

export async function previewCandidateCodesAction(count: number, names: string[] = []): Promise<{ success: boolean; preview?: CodePreview; error?: string }> {
  if (names.length > 500 || names.some(name => name.length > 250)) return { success: false, error: "Invalid names for duplicate check." }
  if (!Number.isInteger(count) || count < 0 || count > 500) return { success: false, error: "Choose at most 500 candidates." }
  const context = await getStaffContext()
  if (!context) return { success: false, error: "Session expired." }
  const { data, error } = await context.supabase.rpc("cbt_get_candidate_code_settings", {
    p_organization_id: context.organizationId,
    p_count: count,
    p_names: names,
  })
  return error ? { success: false, error: error.message } : { success: true, preview: data as CodePreview }
}

export async function saveCandidateCodeSettingsAction(prefix: string, padding: number): Promise<{ success: boolean; error?: string }> {
  if (!/^[A-Za-z0-9_-]{2,40}$/.test(prefix) || !Number.isInteger(padding) || padding < 1 || padding > 12) {
    return { success: false, error: "Use 2–40 letters/digits/_/- and a serial width of 1–12." }
  }
  const context = await getStaffContext()
  if (!context) return { success: false, error: "Session expired." }
  const { error } = await context.supabase.rpc("cbt_set_candidate_code_settings", {
    p_organization_id: context.organizationId,
    p_prefix: prefix.toUpperCase(),
    p_padding: padding,
  })
  return error ? { success: false, error: error.message } : { success: true }
}

export async function bulkImportCandidatesAction(rows: CandidateImportValue[]): Promise<{ success: boolean; result?: ImportResult; error?: string }> {
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 500) return { success: false, error: "Choose 1–500 candidates." }
  const cleaned = rows.map(row => ({ first_name: row.first_name?.trim() ?? "", last_name: row.last_name?.trim() ?? "" }))
  if (cleaned.some(row => !row.first_name || row.first_name.length > 120 || row.last_name.length > 120)) {
    return { success: false, error: "Correct invalid candidate names." }
  }
  const context = await getStaffContext()
  if (!context) return { success: false, error: "Session expired." }
  const { data, error } = await context.supabase.rpc("cbt_bulk_import_candidates", {
    p_organization_id: context.organizationId,
    p_rows: cleaned,
  })
  if (error) return { success: false, error: error.message }
  revalidatePath("/candidates")
  return { success: true, result: data as ImportResult }
}
