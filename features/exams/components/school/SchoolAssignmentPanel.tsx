
import "server-only"

import { getStaffContext } from "@/services/auth"
import { CompleteSchoolAssignments } from "../ExamCompleteSchoolAssignments"
 

export type AttentionRow = {
  studentId: string
  firstName: string
  lastName: string
  admissionNumber: string | null
  className: string
  issueCode:
    | "account_not_linked"
    | "membership_inactive"
    | "identity_conflict"
    | "candidate_inactive"
  assignmentStatus: string | null
}

export type AssignmentAttention = {
  total: number
  rows: AttentionRow[]
  truncated: boolean
}

type Props = {
  examId: string
  slug: string
  publicationId: string
  accessMode: "registered" | "access_code"
}

export async function SchoolAssignmentPanel(props: Props) {
  let attention: AssignmentAttention | null = null
  let attentionError = false

  if (props.accessMode === "registered") {
    const staff = await getStaffContext()

    if (staff) {
      const { data, error } = await staff.supabase.rpc(
        "cbt_get_school_assignment_attention",
        { p_publication_id: props.publicationId }
      )

      if (error) {
        console.error("[CBT:ASSIGNMENT_ATTENTION]", error)
        attentionError = true
      } else {
        attention = data as AssignmentAttention
      }
    } else {
      attentionError = true
    }
  }

  return (
    <CompleteSchoolAssignments
      {...props}
      attention={attention}
      attentionError={attentionError}
    />
  )
}
