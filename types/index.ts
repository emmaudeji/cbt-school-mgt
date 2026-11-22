
import type { createClient } from "@/utils/supabase/server"

export type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>
export type AccessMode = "registered" | "access_code" | "open_link" | null

export * from "./auth"
export * from "./organization"
export * from "./types/school"
