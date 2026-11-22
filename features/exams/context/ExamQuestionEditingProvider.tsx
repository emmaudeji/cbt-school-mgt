
"use client"

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"
import { Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { CbtExamQuestionRuleDetails } from "@/types/exams"
import type { ImportOption } from "@/types/question-import"
import { ExamQuestionEditor } from "../components/ExamQuestionEditor"

type Selection = {
  rule: CbtExamQuestionRuleDetails
  sectionId: string
}

type EditingContext = {
  edit: (selection: Selection) => void
}

const Context = createContext<EditingContext | null>(null)

type Props = {
  slug: string
  sections: ImportOption[]
  topics: ImportOption[]
  children: ReactNode
}

export function ExamQuestionEditingProvider({
  slug,
  sections,
  topics,
  children,
}: Props) {
  const [selection, setSelection] =
    useState<Selection | null>(null)

  const close = useCallback(() => {
    setSelection(null)
  }, [])

  return (
    <Context.Provider value={{ edit: setSelection }}>
      {children}

      <ExamQuestionEditor
        rule={selection?.rule ?? null}
        sectionId={selection?.sectionId ?? ""}
        slug={slug}
        sections={sections}
        topics={topics}
        onClose={close}
      />
    </Context.Provider>
  )
}

export function ExamQuestionEditButton({
  rule,
  sectionId,
}: Selection) {
  const context = useContext(Context)

  if (!context || rule.version?.type !== "single_choice") {
    return null
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shadow-none"
      onClick={() => context.edit({ rule, sectionId })}
    >
      <Pencil className="size-3.5" />
      Edit
    </Button>
  )
}
