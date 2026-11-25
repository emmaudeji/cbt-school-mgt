
"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import type {
  ExtractedQuestion,
} from "../services/question-formatter"

import type {
  ImportQuestion,
} from "@/types/question-import"

type ImportDefaults = {
  sectionId?: string
  topicId?: string
}

type ImportContextValue = {
  questions: ImportQuestion[]
  ready: boolean
  setExtracted: (
    questions: ExtractedQuestion[],
    defaults?: ImportDefaults
  ) => void
  updateQuestion: (
    id: string,
    changes: Partial<ImportQuestion>
  ) => void
  assignAll: (
    field: "sectionId" | "topicId",
    value: string
  ) => void
  removeQuestion: (id: string) => void
  markSaved: (ids: string[]) => void
  clearDraft: () => void
}

const ImportContext =
  createContext<ImportContextValue | null>(null)

type Props = {
  examId: string
  children: ReactNode
}

export function QuestionImportProvider({
  examId,
  children,
}: Props) {
  // Retain v1 so existing browser drafts survive.
  const storageKey =
    `cbt:question-import:v1:${examId}`

  const [questions, setQuestions] =
    useState<ImportQuestion[]>([])

  const [ready, setReady] =
    useState(false)

  useEffect(() => {
    setReady(false)

    try {
      const raw =
        localStorage.getItem(storageKey)

      const parsed: unknown =
        raw ? JSON.parse(raw) : []

      setQuestions(
        Array.isArray(parsed)
          ? (parsed.filter(
              (item): item is ImportQuestion =>
                typeof item === "object" &&
                item !== null &&
                typeof item.id === "string" &&
                typeof item.prompt === "string" &&
                Array.isArray(item.options) &&
                typeof item.saved === "boolean"
            ))
          : []
      )
    } catch (error) {
      console.error(
        "[CBT:RESTORE_IMPORT]",
        error
      )

      setQuestions([])
    }

    setReady(true)
  }, [storageKey])

  useEffect(() => {
    if (!ready) return

    try {
      if (questions.length > 0) {
        localStorage.setItem(
          storageKey,
          JSON.stringify(questions)
        )
      } else {
        localStorage.removeItem(storageKey)
      }
    } catch (error) {
      console.error(
        "[CBT:STORE_IMPORT]",
        error
      )
    }
  }, [questions, ready, storageKey])

  const setExtracted = useCallback(
    (
      extracted: ExtractedQuestion[],
      defaults: ImportDefaults = {}
    ) => {
      setQuestions((current) => {
        const alreadySaved = current.filter(
          (question) => question.saved
        )

        const nextQuestions: ImportQuestion[] =
          extracted.map((question) => ({
            ...question,
            options: question.options.map(
              (option) => ({ ...option })
            ),
            id: crypto.randomUUID(),
            sectionId: defaults.sectionId ?? "",
            topicId: defaults.topicId ?? "",
            difficulty: "medium",
            points: 1,
            reviewed: false,
            saved: false,
          }))

        return [
          ...alreadySaved,
          ...nextQuestions,
        ]
      })
    },
    []
  )

  const updateQuestion = useCallback(
    (
      id: string,
      changes: Partial<ImportQuestion>
    ) => {
      setQuestions((current) =>
        current.map((question) =>
          question.id === id &&
          !question.saved
            ? {
                ...question,
                ...changes,
                id: question.id,
                saved: false,
              }
            : question
        )
      )
    },
    []
  )

  const assignAll = useCallback(
    (
      field: "sectionId" | "topicId",
      value: string
    ) => {
      setQuestions((current) =>
        current.map((question) =>
          question.saved
            ? question
            : {
                ...question,
                [field]: value,
              }
        )
      )
    },
    []
  )

  const removeQuestion = useCallback(
    (id: string) => {
      setQuestions((current) =>
        current.filter(
          (question) =>
            question.id !== id ||
            question.saved
        )
      )
    },
    []
  )

  const markSaved = useCallback(
    (ids: string[]) => {
      const savedIds = new Set(ids)

      setQuestions((current) =>
        current.map((question) =>
          savedIds.has(question.id)
            ? {
                ...question,
                saved: true,
              }
            : question
        )
      )
    },
    []
  )

  const clearDraft = useCallback(() => {
    setQuestions([])

    try {
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.error(
        "[CBT:CLEAR_IMPORT]",
        error
      )
    }
  }, [storageKey])

  const value = useMemo<ImportContextValue>(
    () => ({
      questions,
      ready,
      setExtracted,
      updateQuestion,
      assignAll,
      removeQuestion,
      markSaved,
      clearDraft,
    }),
    [
      questions,
      ready,
      setExtracted,
      updateQuestion,
      assignAll,
      removeQuestion,
      markSaved,
      clearDraft,
    ]
  )

  return (
    <ImportContext.Provider value={value}>
      {children}
    </ImportContext.Provider>
  )
}

export function useQuestionImport() {
  const context =
    useContext(ImportContext)

  if (!context) {
    throw new Error(
      "useQuestionImport must be used inside QuestionImportProvider"
    )
  }

  return context
}












// "use client"

// import {
//   createContext,
//   useContext,
//   useEffect,
//   useState,
//   type ReactNode,
// } from "react"

// import type { ExtractedQuestion } from "../services/question-formatter"
// import { ImportQuestion } from "@/types/question-import"
 

// type ImportDefaults = {
//   sectionId?: string
//   topicId?: string
// }

// type ImportContextValue = {
//   questions: ImportQuestion[]
//   ready: boolean
//   setExtracted: (
//     questions: ExtractedQuestion[],
//     defaults?: ImportDefaults
//   ) => void
//   updateQuestion: (
//     id: string,
//     changes: Partial<ImportQuestion>
//   ) => void
//   assignAll: (
//     field: "sectionId" | "topicId",
//     value: string
//   ) => void
//   removeQuestion: (id: string) => void
//   markSaved: (ids: string[]) => void
//   clearDraft: () => void
// }

// const ImportContext = createContext<ImportContextValue | null>(null)

// export function QuestionImportProvider({
//   examId,
//   children,
// }: {
//   examId: string
//   children: ReactNode
// }) {
//   const storageKey = `cbt:question-import:v1:${examId}`

//   const [questions, setQuestions] = useState<ImportQuestion[]>([])
//   const [ready, setReady] = useState(false)

//   useEffect(() => {
//     setReady(false)

//     try {
//       const saved = localStorage.getItem(storageKey)
//       const parsed: unknown = saved ? JSON.parse(saved) : []

//       setQuestions(
//         Array.isArray(parsed)
//           ? (parsed as ImportQuestion[])
//           : []
//       )
//     } catch (error) {
//       console.error("[CBT:RESTORE_IMPORT]", error)
//       setQuestions([])
//     }

//     setReady(true)
//   }, [storageKey])

//   useEffect(() => {
//     if (!ready) return

//     try {
//       if (questions.length) {
//         localStorage.setItem(storageKey, JSON.stringify(questions))
//       } else {
//         localStorage.removeItem(storageKey)
//       }
//     } catch (error) {
//       console.error("[CBT:STORE_IMPORT]", error)
//     }
//   }, [questions, ready, storageKey])

//   const setExtracted = (
//     extracted: ExtractedQuestion[],
//     defaults: ImportDefaults = {}
//   ) => {
//     setQuestions(
//       extracted.map((question) => ({
//         ...question,
//         options: question.options.map((option) => ({ ...option })),
//         id: crypto.randomUUID(),
//         sectionId: defaults.sectionId ?? "",
//         topicId: defaults.topicId ?? "",
//         difficulty: "medium",
//         points: 1,
//         reviewed: false,
//         saved: false,
//       }))
//     )
//   }

//   const updateQuestion = (
//     id: string,
//     changes: Partial<ImportQuestion>
//   ) => {
//     setQuestions((current) =>
//       current.map((question) =>
//         question.id === id && !question.saved
//           ? {
//               ...question,
//               ...changes,
//               id: question.id,
//               saved: false,
//             }
//           : question
//       )
//     )
//   }

//   const assignAll = (
//     field: "sectionId" | "topicId",
//     value: string
//   ) => {
//     setQuestions((current) =>
//       current.map((question) =>
//         question.saved
//           ? question
//           : { ...question, [field]: value }
//       )
//     )
//   }

//   const removeQuestion = (id: string) => {
//     setQuestions((current) =>
//       current.filter(
//         (question) => question.id !== id || question.saved
//       )
//     )
//   }

//   const markSaved = (ids: string[]) => {
//     const savedIds = new Set(ids)

//     setQuestions((current) =>
//       current.map((question) =>
//         savedIds.has(question.id)
//           ? { ...question, saved: true }
//           : question
//       )
//     )
//   }

//   const clearDraft = () => {
//     setQuestions([])
//     localStorage.removeItem(storageKey)
//   }

//   return (
//     <ImportContext.Provider
//       value={{
//         questions,
//         ready,
//         setExtracted,
//         updateQuestion,
//         assignAll,
//         removeQuestion,
//         markSaved,
//         clearDraft,
//       }}
//     >
//       {children}
//     </ImportContext.Provider>
//   )
// }

// export function useQuestionImport() {
//   const context = useContext(ImportContext)

//   if (!context) {
//     throw new Error(
//       "useQuestionImport must be used inside QuestionImportProvider"
//     )
//   }

//   return context
// }