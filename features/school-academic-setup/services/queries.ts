
import "server-only"

import { redirect } from "next/navigation"

import { getStaffContext } from "@/services/auth"
import { tables, urls } from "@/constants"
import { SupabaseClient } from "@supabase/supabase-js"
import { AppRole } from "@/types"
import { AcademicSetupData } from "@/types/school-integration"


export async function getAcademicSetupData(contxt?:{
    supabase: SupabaseClient<any, "public", "public", any, any>;
    userId: string;
    organizationId: string;
    roles: AppRole[];
} | null):
  Promise<AcademicSetupData | null> {
  const context = contxt ? contxt : await getStaffContext()

  if (!context) redirect(urls.login)

  const organizationId = context.organizationId

  const { data: school, error: schoolError } =
    await context.supabase
      .from(tables.organizations)
      .select("id, name, slug, type, status")
      .eq("id", organizationId)
      .maybeSingle()

  if (
    schoolError ||
    !school ||
    school.type !== "school" ||
    school.status !== "active"
  ) {
    console.error(
      "[SCHOOL:SETUP_ORGANIZATION]",
      schoolError?.message ?? "School unavailable"
    )
    return null
  }

  const [sessionsResult, termsResult] =
    await Promise.all([
      context.supabase
        .from("school_academic_sessions")
        .select(
          "id, name, is_current, starts_on, ends_on"
        )
        .eq("organization_id", organizationId)
        .order("name", { ascending: false }),

      context.supabase
        .from("school_terms")
        .select(
          "id, session_id, name, position, is_current, starts_on, ends_on"
        )
        .eq("organization_id", organizationId)
        .order("position", { ascending: true }),
    ])

  if (sessionsResult.error || termsResult.error) {
    console.error("[SCHOOL:ACADEMIC_SETUP]", {
      sessions: sessionsResult.error?.message,
      terms: termsResult.error?.message,
    })

    return null
  }

  return {
    school: {
      id: school.id,
      name: school.name,
      slug: school.slug,
    },
    sessions: sessionsResult.data ?? [],
    terms: termsResult.data ?? [],
  }
}
