
"use client"

import Link from "next/link"
import {
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  CheckCircle2,
  Info,
  Loader2,
  Plus,
} from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { InputField } from "@/components/shared/InputField"
import { TextareaField } from "@/components/shared/TextareaField"
import SelectOrCreateDropdown, {
  type SelectOption,
} from "@/components/shared/SelectOrCreateDropdown"
import CustomSelect from "@/components/shared/CustomSelect"

import { urls } from "@/constants"
import type { getQuestionEditorOptions } from "../services/queries"
import {
  addExistingExamSectionAction,
  createExamSectionAction,
  createTopicAction,
  useOrganizationTopicAction,
} from "../services/action.examSections"
import { saveExamQuestionAction } from "../services/saveExamQuestionAction"

type EditorData = Awaited<
  ReturnType<typeof getQuestionEditorOptions>
>

 
const answerKeys = ["a", "b", "c", "d"] as const

const answerChoices = answerKeys.map(key => ({
  label: `Option ${key.toUpperCase()}`,
  value: key,
}))

function addOption(
  options: SelectOption[],
  option: SelectOption
): SelectOption[] {
  if (options.some(item => item.id === option.id)) {
    return options
  }

  return [...options, option].sort((a, b) =>
    a.name.localeCompare(b.name)
  )
}


type Props = {
  exam: EditorData["exam"]
  initialTopics: EditorData["topics"]
  initialSections: EditorData["sections"]
  initialSectionId?: string
  organizationTopics: SelectOption[]
  organizationSections: {
    id: string
    title: string
  }[]
}

export function NewQuestionForm({
  exam,
  initialTopics,
  initialSections,
  initialSectionId = "",
  organizationTopics,
  organizationSections,
}: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const [pending, startTransition] = useTransition()
  const [saveError, setSaveError] = useState("")

  const [topics, setTopics] =
    useState<SelectOption[]>(initialTopics)

  const [sections, setSections] = useState<SelectOption[]>(
    initialSections.map(section => ({
      id: section.id,
      name: section.title,
    }))
  )

  const [topicId, setTopicId] = useState("")

  // Initialize from the validated URL section.
  const [sectionId, setSectionId] = useState(
    initialSectionId
  )

  const [prompt, setPrompt] = useState("")
  const [correctOption, setCorrectOption] = useState("")
  const [difficulty, setDifficulty] = useState("easy")

  const [options, setOptions] = useState<
    Record<string, string>
  >({
    a: "",
    b: "",
    c: "",
    d: "",
  })

  const editable =
    exam.status === "draft" ||
    exam.status === "active"

  const hasDefaults = Boolean(
    exam.default_bank_id &&
    exam.default_category_id
  )

  const returnUrl = urls.examQuestions(exam.slug)

  const sectionCatalogOptions = useMemo(
    () =>
      organizationSections.map(section => ({
        id: section.id,
        name: section.title,
      })),
    [organizationSections]
  )

  const canSave = useMemo(
    () =>
      editable &&
      hasDefaults &&
      !!sectionId &&
      !!correctOption &&
      !!prompt.trim() &&
      answerKeys.every(key => !!options[key].trim()),
    [
      editable,
      hasDefaults,
      sectionId,
      correctOption,
      prompt,
      options,
    ]
  )

  const createSection = (name: string) =>
    createExamSectionAction(exam.id, name)

  const useSection = (templateId: string) =>
    addExistingExamSectionAction(exam.id, templateId)

  const createTopic = (name: string) =>
    createTopicAction(
      exam.default_bank_id!,
      exam.default_category_id!,
      name
    )

  const useTopic = (catalogTopicId: string) =>
    useOrganizationTopicAction(
      catalogTopicId,
      exam.default_bank_id!,
      exam.default_category_id!
    )

  const saveQuestion = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (pending || !canSave) return

    const submitter = (
      event.nativeEvent as SubmitEvent
    ).submitter as HTMLButtonElement | null

    const addAnother = submitter?.value === "another"
    const formData = new FormData(event.currentTarget)

    formData.set("section_id", sectionId)
    formData.set("topic_id", topicId)
    formData.set("correct_option", correctOption)
    formData.set("difficulty", difficulty)

    setSaveError("")

    startTransition(async () => {
      try {
        const result = await saveExamQuestionAction(
          exam.id,
          exam.slug,
          formData
        )

        if (!result.success) {
          const message =
            result.error ?? "Unable to save question."

          setSaveError(message)
          toast.error(message)
          return
        }

        toast.success("Question saved successfully.")

        if (!addAnother) {
          router.push(returnUrl)
          return
        }

        // Retain section and topic for the next question.
        formRef.current?.reset()

        setPrompt("")
        setOptions({
          a: "",
          b: "",
          c: "",
          d: "",
        })
        setCorrectOption("")
        setDifficulty("easy")
        router.refresh()
      } catch (error) {
        console.error("[CBT:SAVE_QUESTION]", error)

        const message = "Unable to save question. Please try again."
        setSaveError(message)
        toast.error(message)
      }
    })
  }

  return (
    <form
      ref={formRef}
      onSubmit={saveQuestion}
      className="mx-auto w-full max-w-4xl space-y-5"
    >
      <Card className="gap-0 overflow-hidden rounded-xl border border-primary/20 p-0 shadow-none">
        <CardHeader className="gap-3 border-b border-primary/15 bg-primary/5 py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" />

            <h2 className="text-sm font-bold text-foreground">
              Question Classification
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-foreground/70">
                Question Bank
              </p>

              <p className="mt-1 text-sm font-semibold text-foreground">
                {exam.bank?.name ?? "Not selected"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-foreground/70">
                Subject
              </p>

              <p className="mt-1 text-sm font-semibold text-foreground">
                {exam.category?.name ?? "Not selected"}
              </p>
            </div>
          </div>

          <p className="text-xs leading-5 text-foreground/80">
            Questions are saved under this bank and subject
            for future reuse.
          </p>
        </CardHeader>

        <CardContent className="space-y-5 py-5">
          {!hasDefaults && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm font-medium text-destructive"
            >
              This examination needs a question bank and
              subject before questions can be added.
            </div>
          )}

          {!editable && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm font-medium text-destructive"
            >
              This examination is not available for editing.
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <SelectOrCreateDropdown
              name="section_id"
              label="Examination Section"
              description="Select a section or create a new one."
              placeholder="Select section"
              createLabel="Create New Section"
              value={sectionId}
              options={sections}
              availableOptions={sectionCatalogOptions}
              onChange={setSectionId}
              onUseAvailable={useSection}
              onCreate={createSection}
              onCreated={item => {
                setSections(current => addOption(current, item))
                setSectionId(item.id)
              }}
              required
              disabled={!editable || pending}
            />

            <SelectOrCreateDropdown
              name="topic_id"
              label="Question Topic"
              description="Optional. Select an existing topic or create one."
              placeholder="Select topic (optional)"
              createLabel="Create New Topic"
              value={topicId}
              options={topics}
              availableOptions={organizationTopics}
              onChange={setTopicId}
              onUseAvailable={useTopic}
              onCreate={createTopic}
              onCreated={item => {
                setTopics(current => addOption(current, item))
                setTopicId(item.id)
              }}
              disabled={!editable || !hasDefaults || pending}
            />
          </div>

          <div className="space-y-4 border-t border-primary/15 pt-5">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">
                Question & Answers
              </h3>

              <p className="text-xs text-foreground/80">
                Enter the question and its four answer choices.
              </p>
            </div>

            <TextareaField
              name="prompt"
              label="Question"
              description="Write the question participants will answer."
              placeholder="e.g. What is 12 multiplied by 5?"
              value={prompt}
              onChange={event =>
                setPrompt(event.target.value)
              }
              rows={4}
              required
              disabled={!editable || pending}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {answerKeys.map(key => (
                <InputField
                  key={key}
                  name={`option_${key}`}
                  label={`Option ${key.toUpperCase()}`}
                  placeholder={`Enter option ${key.toUpperCase()}`}
                  value={options[key]}
                  onChange={event =>
                    setOptions(current => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  required
                  disabled={!editable || pending}
                />
              ))}
            </div>

            <CustomSelect
              name="correct_option"
              label="Correct Answer"
              description="Select the correct answer for marking."
              placeholder="Select correct answer"
              options={answerChoices}
              value={correctOption}
              onChange={setCorrectOption}
              required
              disabled={!editable || pending}
            />
          </div>

          <div className="grid gap-5 border-t border-primary/15 pt-5 sm:grid-cols-2">
            <InputField
              name="points"
              label="Marks"
              description="Marks awarded for a correct answer."
              type="number"
              min={0}
              step={0.5}
              defaultValue={1}
              required
              disabled={!editable || pending}
            />

            <CustomSelect
              name="difficulty"
              label="Difficulty"
              description="Used to organize questions in the question bank."
              options={[
                { label: "Easy", value: "easy" },
                { label: "Medium", value: "medium" },
                { label: "Hard", value: "hard" },
              ]}
              value={difficulty}
              onChange={setDifficulty}
              required
              disabled={!editable || pending}
            />
          </div>

          <TextareaField
            name="explanation"
            label="Answer Explanation (optional)"
            description="Explain why the selected answer is correct."
            placeholder="e.g. 12 × 5 = 60."
            rows={3}
            disabled={!editable || pending}
          />

          <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />

            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Save and reuse
              </p>

              <p className="text-xs leading-5 text-foreground/85">
                This question will be added to the selected
                examination section and saved for future reuse.
                For an active examination, publish a new
                revision when your changes are ready.
              </p>
            </div>
          </div>

          {saveError && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm font-medium text-destructive"
            >
              {saveError}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-primary/15 bg-primary/5 py-5">
          <Button
            type="button"
            variant="outline"
            asChild
            className="shadow-none"
          >
            <Link href={returnUrl}>
              Cancel
            </Link>
          </Button>

          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              name="intent"
              value="another"
              variant="outline"
              disabled={!canSave || pending}
              className="shadow-none"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}

              Save & Add Another
            </Button>

            <Button
              type="submit"
              name="intent"
              value="finish"
              disabled={!canSave || pending}
              className="shadow-none"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}

              {pending ? "Saving..." : "Save Question"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  )
}
