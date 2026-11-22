
"use server"

import { createClient } from "@/utils/supabase/server"
import { SCHOOL_SLUG, tables } from "@/constants"
import type { SchoolProp } from "@/types/school"
import type { DbResult } from "@/services"

export async function getSchool(): Promise<DbResult<SchoolProp>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from(tables.organizations)
    .select(`
      name, id,
      school:school_details!inner (*)
    `)
    .eq("slug", SCHOOL_SLUG)
    .eq("type", "school")
    .single()

  if (error) {
    console.error("[GET SCHOOL]", error.message)
    return { data: null, error: error.message }
  }

  const school = data.school as unknown as SchoolProp

  return {
    data: {
      ...school,
      name: data.name,
      organization_id: data.id,
    } as SchoolProp,
    error: null,
  }
}


import { revalidatePath } from "next/cache"
import { updateData } from "@/services"
import { logActivity } from "@/services/logging.service"
 
export async function updateSchool(
  input: Partial<SchoolProp>, school_id:string, organization_name:string
): Promise<DbResult<SchoolProp>> {
  try {
    const supabase = await createClient()

    // Only editable fields are accepted.
    const {
      name,
      code,
      short_name,
      motto,
      logo_path,
      school_level,
      institution_type,
      status,
      opened_on,
      address,
      address_line_2,
      city,
      district,
      state,
      country,
      postal_code,
      phone,
      email,
      website,
    } = input

    const schoolUpdates = Object.fromEntries(
      Object.entries({
        code,
        short_name,
        motto,
        logo_path,
        school_level,
        institution_type,
        status,
        opened_on,
        address,
        address_line_2,
        city,
        district,
        state,
        country,
        postal_code,
        phone,
        email,
        website,
      }).filter(([, value]) => value !== undefined)
    )

    if (!Object.keys(schoolUpdates).length && name === undefined) {
      return { data: null, error: "No changes provided." }
    }

    // Update school-specific information.
    if (Object.keys(schoolUpdates).length) {
      const result = await updateData(
        tables.school_details,
        { id: school_id },
        schoolUpdates
      )

      if (result.error) {
        return { data: null, error: result.error }
      }
    }

    // Official name belongs to organizations.
    if (name !== undefined && name !== organization_name) {
      const { error } = await supabase
        .from(tables.organizations)
        .update({ name: name.trim() })
        .eq("slug", SCHOOL_SLUG)

      if (error) {
        return { data: null, error: error.message }
      }
    }

    await logActivity({
      action: "update",
      description: "Updated school information",
      entityType: tables.school_details,
      entityId: school_id,
      metadata: {
        fields: [
          ...Object.keys(schoolUpdates),
          ...(name !== undefined ? ["name"] : []),
        ].join(", "),
      },
    })

    revalidatePath("/", "layout")

    return await getSchool()
  } catch (error) {
    console.error("[UPDATE SCHOOL]", error)

    return {
      data: null,
      error: "Failed to update school information.",
    }
  }
}
