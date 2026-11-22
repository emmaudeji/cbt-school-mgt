
"use client"

import { useRouter } from "next/navigation"
import { useOrgStore } from "@/store/org-store"

import SelectOrCreateDropdown from "@/components/shared/SelectOrCreateDropdown"

import {
  addExistingExamSectionAction,
  createExamSectionAction,
} from "../services/action.examSections"

type Template = {
  id: string
  title: string
}

type Props = {
  examId: string
  templates: Template[]
  usedTemplateIds: (string | null)[]
  disabled?: boolean
}

export function ExamSectionControls({
  examId,
  templates,
  usedTemplateIds,
  disabled = false,
}: Props) {
  const router = useRouter()

  const isSchool = useOrgStore(
    state => state.organization.type === "school"
  )

  const available = templates
    .filter(
      template => !usedTemplateIds.includes(template.id)
    )
    .map(template => ({
      id: template.id,
      name: template.title,
    }))

  return (
    <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold  text-foreground">
          Add Section
        </h2>

        <span className="rounded-md bg-violet-500/10 px-2 py-1 text-[10px] font-semibold text-violet-700 dark:text-violet-300">
          {available.length} available
        </span>
      </div>

      <SelectOrCreateDropdown
        name="add_exam_section"
        label="Section"
        description={
          isSchool
            ? "Choose a school section or create a new one."
            : "Choose a reusable section or create a new one."
        }
        placeholder="Choose or create section"
        createLabel="Create New Section"
        value=""
        options={[]}
        availableOptions={available}
        onChange={() => {}}
        onUseAvailable={templateId =>
          addExistingExamSectionAction(
            examId,
            templateId
          )
        }
        onCreate={name =>
          createExamSectionAction(examId, name)
        }
        onCreated={() => {
          router.refresh()
        }}
        disabled={disabled}
      />
    </div>
  )
}
