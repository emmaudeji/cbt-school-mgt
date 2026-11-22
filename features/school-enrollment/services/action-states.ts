
export type EnrollmentActionState = {
  ok: boolean
  message: string
  created: number
  skipped: number
}

export const initialEnrollmentState:
  EnrollmentActionState = {
    ok: false,
    message: "",
    created: 0,
    skipped: 0,
  }

export type EndEnrollmentState = {
  ok: boolean
  message: string
}

export const initialEndEnrollmentState:
  EndEnrollmentState = {
    ok: false,
    message: "",
  }
