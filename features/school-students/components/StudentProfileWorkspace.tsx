
"use client"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"

import { LinkButton } from "@/components/shared/LinkButton"
 
import { urls } from "@/constants"

// import type { StudentProfile } from "../../../types/students"

import StudentProfileHeader from "./StudentProfileHeader"
import StudentPersonalDetails from "./StudentPersonalDetails"
import StudentGuardians from "./StudentGuardians"
import StudentAcademicHistory from "./StudentAcademicHistory"
import StudentResults from "./StudentResults"
import StudentEditDrawer from "./StudentEditDrawer"
import { canManageSchool } from "@/lib"
import { useOrgStore } from "@/store/org-store"
import { StudentProfile } from "@/types/students"

type Props = {
  profile: StudentProfile
}

export type StudentEditMode = "identity" | "details" | null

export default function StudentProfileWorkspace({
  profile,
}: Props) {
  const [editMode, setEditMode] =
    useState<StudentEditMode>(null)

    const roles = useOrgStore((state) => state.roles)
    const canManage = canManageSchool(roles)

  return (
    <div className="space-y-5 pb-8">
      <LinkButton
        href={urls.students}
        variant="ghost"
        size="sm"
      >
        <ArrowLeft className="size-4" />
        All Students
      </LinkButton>

      <StudentProfileHeader
        profile={profile}
        canManage={canManage}
        onEdit={() => setEditMode("identity")}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <StudentPersonalDetails
          profile={profile}
          canManage={canManage}
          onEdit={() => setEditMode("details")}
        />

        <StudentGuardians
          studentId={profile.student.id}
          guardians={profile.guardians}
          canManage={canManage}
        />
      </div>

      <StudentAcademicHistory
        enrollments={profile.enrollments}
      />

      <StudentResults
        reportCards={profile.reportCards}
      />

      {canManage && (
        <StudentEditDrawer
          key={editMode ?? "closed"}
          mode={editMode}
          profile={profile}
          onClose={() => setEditMode(null)}
        />
      )}
    </div>
  )
}
