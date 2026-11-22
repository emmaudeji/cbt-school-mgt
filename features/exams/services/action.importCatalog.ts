
"use server"

import { getStaffContext } from "@/services/auth"

type CatalogItem = {
  id: string
  name: string
}

type Result = {
  success: boolean
  error?: string
  sections: CatalogItem[]
  topics: CatalogItem[]
}

export async function getImportCatalogOptionsAction(): Promise<Result> {
  const context = await getStaffContext()

  if (!context) {
    return {
      success: false,
      error: "Your session has expired.",
      sections: [],
      topics: [],
    }
  }

  const [sectionsResult, topicsResult] =
    await Promise.all([
      context.supabase
        .from("cbt_section_templates")
        .select("id, title")
        .eq("organization_id", context.organizationId)
        .order("title"),

      context.supabase
        .from("cbt_topic_catalog")
        .select("id, name")
        .eq("organization_id", context.organizationId)
        .order("name"),
    ])

  if (sectionsResult.error || topicsResult.error) {
    return {
      success: false,
      error: "Unable to load reusable sections and topics.",
      sections: [],
      topics: [],
    }
  }

  return {
    success: true,
    sections: (sectionsResult.data ?? []).map(item => ({
      id: item.id,
      name: item.title,
    })),
    topics: topicsResult.data ?? [],
  }
}
