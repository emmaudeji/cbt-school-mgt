
import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  CBT_ORGANIZATION_SLUG,
  urls,
  tables,
} from "@/constants";

import type {
  AppRole,
  AppPermission,
  OrganizationMembership,
  UserProfile,
  SchoolContext,
} from "@/types/auth";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Existing helper names retained.

export async function getProfileById(
  supabase: Supabase,
  userId: string
) {
  const { data, error } = await supabase
    .from(tables.profiles)
    .select("id, first_name, last_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data as Omit<UserProfile, "email"> | null;
}

export async function getOrganizationBySlug(
  supabase: Supabase,
  slug: string
) {
  const { data, error } = await supabase
    .from(tables.organizations)
    .select("id, name, slug, type, status, timezone")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data as Organization | null;
}

export async function getOrganizationById(
  supabase: Supabase,
  organizationId: string
) {
  const { data, error } = await supabase
    .from(tables.organizations)
    .select("id, name, slug, type, status, timezone")
    .eq("id", organizationId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data as Organization | null;
}

export async function getActiveMembership(
  supabase: Supabase,
  userId: string,
  organizationId: string
): Promise<OrganizationMembership | null> {
  const { data, error } = await supabase
    .from(tables.organization_memberships)
    .select("id, organization_id, user_id, status")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return { ...data, roles: [] };
}

export async function getUserRoles(
  supabase: Supabase,
  organizationId: string,
  membershipId: string
): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from(tables.membership_roles)
    .select("role_code")
    .eq("organization_id", organizationId)
    .eq("membership_id", membershipId);

  if (error) throw new Error(error.message);

  return [
    ...new Set(
      (data ?? []).map((item) => item.role_code as AppRole)
    ),
  ];
}

export async function getUserPermissions(
  supabase: Supabase,
  roles: AppRole[]
): Promise<AppPermission[]> {
  if (!roles.length) return [];

  const { data, error } = await supabase
    .from(tables.role_permissions)
    .select("permission_code")
    .in("role_code", roles);

  if (error) throw new Error(error.message);

  return [
    ...new Set(
      (data ?? []).map(
        (item) => item.permission_code as AppPermission
      )
    ),
  ];
}

// Main context, retaining your previous function name.
export async function getOrgContext():
  Promise<SchoolContext | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser) return null;

  const organization = await getOrganizationBySlug(
    supabase,
    CBT_ORGANIZATION_SLUG
  );

  if (!organization) return null;

  const membership = await getActiveMembership(
    supabase,
    authUser.id,
    organization.id
  );

  if (!membership) return null;

  const [profile, roles] = await Promise.all([
    getProfileById(supabase, authUser.id),
    getUserRoles(
      supabase,
      organization.id,
      membership.id
    ),
  ]);

  if (!profile || !roles.length) return null;

  const permissions = await getUserPermissions(
    supabase,
    roles
  );

  return {
    user: {
      ...profile,
      email: authUser.email ?? "",
    },
    organization,
    membership: {
      ...membership,
      roles,
    },
    roles,
    permissions,
  };
}


import {
  CBT_ORGANIZATION_ID,
} from "@/constants"

import { isAdmin, isStaff } from "./helper"

export async function getStaffContext(orgId?: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  const organizationId = orgId || CBT_ORGANIZATION_ID
  if (!organizationId) return null

  const { data: membership, error: membershipError } =
    await supabase
      .from(tables.organization_memberships)
      .select(`
        id,
        membership_roles (
          role_code
        )
      `)
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

  if (membershipError || !membership) return null

  const roles = membership.membership_roles.map(
    (item) => item.role_code as AppRole
  )
  
  // console.log({roles})
  if (!isStaff(roles)) {
    
    return null
  }
  
  // console.log({roles})
  return {
    supabase,
    userId: user.id,
    organizationId,
    roles,
  }
}

export async function getAdminContext(orgId?: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  const organizationId = orgId || CBT_ORGANIZATION_ID
  if (!organizationId) return null

  const { data: membership, error: membershipError } =
    await supabase
      .from(tables.organization_memberships)
      .select(`
        id,
        membership_roles (
          role_code
        )
      `)
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

  if (membershipError || !membership) return null
  
  console.log({membership})
  const roles = membership.membership_roles.map(
    (item) => item.role_code as AppRole
  )

  if (!isAdmin(roles)) {
    return null
  }

  return {
    supabase,
    userId: user.id,
    organizationId,
    roles,
  }
}

// Simple server-side permission checks.
export function hasPermission(
  context: SchoolContext,
  permission: AppPermission
): boolean {
  return context.permissions.includes(permission);
}

export async function requirePermission(
  permission: AppPermission
): Promise<SchoolContext> {
  const context = await getOrgContext();

  if (!context) redirect(urls.login);

  if (!hasPermission(context, permission)) {
    throw new Error("You do not have permission to perform this action.");
  }

  return context;
}

export async function getMembership(
  userId: string,
  organizationSlug: string,
  supabaseClient?: ServerSupabaseClient,
): Promise<OrganizationMembership | null> {
  const supabase = supabaseClient ? supabaseClient : await createClient()
  const { data, error } = await supabase
    .from(tables.organization_memberships)
    .select(`
      id,
      organization_id,
      user_id,
      status,
      organization:organizations!inner (
        slug
      ),
      membership_roles (
        role_code
      )
    `)
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("organization.slug", organizationSlug)
    .maybeSingle()

  if (error) {
    throw new Error(`Membership lookup failed: ${error.message}`)
  }

  if (!data) return null

  return {
    id: data.id,
    organization_id: data.organization_id,
    user_id: data.user_id,
    status: data.status as OrganizationMembership["status"],
    roles: [
      ...new Set(
        (data.membership_roles ?? []).map(
          (item) => item.role_code as AppRole
        )
      ),
    ],
  }
}


import { supabaseAdmin } from "@/utils/supabase/secrete-client"
import type { Organization, OrganizationSettings, SchoolBranding, SchoolProp, ServerSupabaseClient } from "@/types"
import { getAppearance } from "@/lib";
 
export async function getPublicBranding(): Promise<SchoolBranding> {
  const { data, error } = await supabaseAdmin
    .from(tables.organizations)
    .select(`
      id,
      name,
      settings,
      school:school_details!inner (
        short_name,
        motto,
        logo_path
      )
    `)
    .eq("slug", CBT_ORGANIZATION_SLUG)
    .eq("type", "school")
    .eq("status", "active")
    .single()

  if (error || !data) {
    throw new Error(
      `Unable to load school branding: ${error?.message ?? "Not found"}`
    )
  }
  const school = data.school as unknown as Partial<SchoolProp>

  return {
    organizationId: data.id,
    name: data.name,
    shortName: school.short_name!,
    motto: school.motto!,
    logoPath: school.logo_path!,
    appearance: getAppearance(
      data.settings as OrganizationSettings
    ),
  }
}




// ==============================

// export async function getAuthUser(): Promise<User | null> {
//   const supabase = await createClient()
//   const { data, error } = await supabase.auth.getUser()

//   if (error) return null

//   return data.user
// }

// export async function getUser(): Promise<SchoolUser | null> {
//   const supabase = await createClient()

//   const { data: auth, error: authError } =
//     await supabase.auth.getUser()

//   if (authError || !auth.user) return null

//   const { data, error } = await supabase
//     .from("profiles")
//     .select(
//       "id, school_id, role, first_name, last_name, admission_number, staff_number, is_active"
//     )
//     .eq("id", auth.user.id)
//     .maybeSingle()

//   if (error || !data || !data.is_active) return null

//   const user = data as Omit<SchoolUser, "initials">

//   return {
//     ...user,
//     initials:
//       `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase(),
//   }
// }

// export async function requireAdmin(): Promise<SchoolUser> {
//   const user = await getUser()

//   if (!user || user.role !== "admin") {
//     throw new Error("Administrator access required.")
//   }

//   return user
// }