
import "server-only"

import { createClient } from "@/utils/supabase/server"

export type StudentDashboardData = {
  student_id: string
  organization_id: string
  school_name: string
  first_name: string
  last_name: string
  other_names: string | null
  admission_number: string | null
  school_login: string
  membership_status: string
  student_status: string
  session_name: string | null
  class_name: string | null
}

export type StudentDashboardResult =
  | {
      status: "unauthenticated"
      data: null
    }
  | {
      status: "unavailable"
      data: null
    }
  | {
      status: "ready"
      data: StudentDashboardData
    }

export async function getStudentDashboard():
  Promise<StudentDashboardResult> {
  const supabase = await createClient()

  // getUser() verifies the current user with
  // Supabase Auth rather than trusting a decoded
  // client-side JWT alone.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      status: "unauthenticated",
      data: null,
    }
  }

  const { data, error } = await supabase.rpc(
    "school_my_student_dashboard"
  )

  if (error) {
    console.error(
      "[STUDENT:DASHBOARD]",
      {
        code: error.code,
        message: error.message,
      }
    )

    return {
      status: "unavailable",
      data: null,
    }
  }

  if (!data || typeof data !== "object") {
    return {
      status: "unavailable",
      data: null,
    }
  }

  const student =
    data as unknown as StudentDashboardData

  if (
    typeof student.student_id !== "string" ||
    typeof student.organization_id !== "string" ||
    student.membership_status !== "active" ||
    student.student_status !== "active"
  ) {
    return {
      status: "unavailable",
      data: null,
    }
  }

  return {
    status: "ready",
    data: student,
  }
}
