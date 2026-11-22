import { Organization } from "./organization"

export type AppRole =
  | "owner"
  | "admin"
  | "examiner"
  | "candidate"
  | (string & {});

export type AppPermission =
  | "organization.manage"
  | "members.manage"
  | "questions.manage"
  | "exams.manage"
  | "exams.take"
  | "results.manage"
  | (string & {});

export type UserProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
};

export type OrganizationMembership = {
  id: string;
  organization_id: string;
  user_id: string;
  status: string;
  roles: AppRole[];
};

export type SchoolContext = {
  user: UserProfile;
  organization: Organization;
  membership: OrganizationMembership;
  roles: AppRole[];
  permissions: AppPermission[];
};


// ================================================== //

export interface MembershipRole {
  organization_id: string
  membership_id: string
  role_code: AppRole
}

 export type AuthResult =
  | { success: true; redirectTo?: string }
  | { success: false; error: string }



// export interface AppUser extends UserProfile {
//   email: string | null
// }

// export type AppRole =
//   | "owner"
//   | "admin"
//   | "school_admin"
//   | "school_teacher"
//   | "school_student"
//   | "examiner"
//   | "candidate"
//   | (string & {})


// export interface SchoolContext {
//   user: AppUser
//   organization: Organization
//   school: SchoolProp
//   membership: OrganizationMembership
//   roles: AppRole[]
//   appearance: AppAppearance
//   sessionId: string | null
//   sessionName: string | null
//   termId: string | null
//   termName: string | null
// }


// export interface OrganizationMembership {
//   id: string
//   organization_id: string
//   user_id: string
//   status: "active" | "invited" | "suspended"
//   roles: AppRole[]
// }



// ====================================================
