
export type SetupActionState = {
  ok: boolean
  message: string
  id: string | null
}

export const initialSetupState: SetupActionState = {
  ok: false,
  message: "",
  id: null,
}

export type SaveClassSubjectsState = {
  ok: boolean
  message: string
  created: number
}

export const initialClassSubjectsState:
  SaveClassSubjectsState = {
    ok: false,
    message: "",
    created: 0,
  }

export type CreateClassState = {
  ok: boolean
  message: string
  id: string | null
}

export const initialCreateClassState:
  CreateClassState = {
    ok: false,
    message: "",
    id: null,
  }

  
export type ApplyAssessmentState = {
  ok: boolean
  message: string
  created: number
  preserved: number
}

export const initialAssessmentState:
  ApplyAssessmentState = {
    ok: false,
    message: "",
    created: 0,
    preserved: 0,
  }

 
  