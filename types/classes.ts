
export interface ClassLevel {
  id: string
  organization_id: string
  name: string
  slug: string
  position: number
}

export interface ClassStream {
  id: string
  organization_id: string
  name: string
}

export interface ClassArm {
  id: string
  organization_id: string
  name: string
}

export interface SchoolClass {
  id: string
  organization_id: string
  session_id: string
  level_id: string
  stream_id: string | null
  arm_id: string | null
  name: string
}

export interface SchoolClassWithRelations extends SchoolClass {
  level: ClassLevel
  stream: ClassStream | null
  arm: ClassArm | null
}

// import type { AcademicSession } from "@/types/academics"

// // Add to your existing ClassStructure interface:
// export interface ClassStructure {
//   organization_id: string
//   sessions: AcademicSession[]
//   levels: ClassLevel[]
//   streams: ClassStream[]
//   arms: ClassArm[]
//   classes: SchoolClassWithRelations[]
// }

import type { AcademicSession } from "@/types/academics"

export interface ClassStructure {
  organization_id: string
  sessions: AcademicSession[]
  levels: ClassLevel[]
  streams: ClassStream[]
  arms: ClassArm[]
}

export type StructureKind = "level" | "stream" | "arm"

export type CreateClassLevel = Pick<ClassLevel, "organization_id" | "name">
export type CreateClassStream = Pick<ClassStream, "organization_id" | "name">
export type CreateClassArm = Pick<ClassArm, "organization_id" | "name">

export type CreateSchoolClass = Pick<
  SchoolClass,
  | "organization_id"
  | "session_id"
  | "level_id"
  | "stream_id"
  | "arm_id"
  | "name"
>

export type UpdateClassLevel = Partial<Pick<ClassLevel, "name">>
export type UpdateClassStream = Partial<Pick<ClassStream, "name">>
export type UpdateClassArm = Partial<Pick<ClassArm, "name">>

export type UpdateSchoolClass = Partial<
  Pick<
    SchoolClass,
    "session_id" | "level_id" | "stream_id" | "arm_id" | "name"
  >
>

export type ClassStructureResult<T> = {
  data: T | null
  error: string | null
  successMessage: string | null
}
