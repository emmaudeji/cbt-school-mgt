
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
import { toast } from "react-toastify"

import {
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardList,
  Info,
  Loader2,
  Plus,
  Save,
  Target,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import SelectOrCreateDropdown, {
  type SelectOption,
} from "@/components/shared/SelectOrCreateDropdown"

import { urls } from "@/constants"

import type {
  getQuestionEditorOptions,
} from "../services/queries"

import {
  addExistingExamSectionAction,
  createExamSectionAction,
  createTopicAction,
  useOrganizationTopicAction,
} from "../services/action.examSections"

import {
  saveExamQuestionAction,
} from "../services/saveExamQuestionAction"

type EditorData =
  Awaited<ReturnType<typeof getQuestionEditorOptions>>

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

const ANSWER_KEYS = [
  "a",
  "b",
  "c",
  "d",
] as const

type AnswerKey =
  (typeof ANSWER_KEYS)[number]

type Difficulty =
  | "easy"
  | "medium"
  | "hard"

type AnswerOptions =
  Record<AnswerKey, string>

const EMPTY_OPTIONS: AnswerOptions = {
  a: "",
  b: "",
  c: "",
  d: "",
}

function addOption(
  options: SelectOption[],
  option: SelectOption
): SelectOption[] {
  if (
    options.some(
      (item) => item.id === option.id
    )
  ) {
    return options
  }

  return [...options, option].sort(
    (a, b) => a.name.localeCompare(b.name)
  )
}

function SectionTitle({
  number,
  icon: Icon,
  title,
  color,
}: {
  number: number
  icon: typeof BookOpen
  title: string
  color: "blue" | "violet" | "emerald"
}) {
  const classes = {
    blue: "bg-blue-600",
    violet: "bg-violet-600",
    emerald: "bg-emerald-600",
  }

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex size-9 items-center justify-center rounded-lg text-white ${classes[color]}`}
      >
        <Icon className="size-4" />
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-foreground/65">
          Step {number}
        </p>

        <h2 className="text-sm font-bold">
          {title}
        </h2>
      </div>
    </div>
  )
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

  const [pending, startTransition] =
    useTransition()

  const [saveError, setSaveError] =
    useState("")

  const [topics, setTopics] =
    useState<SelectOption[]>(initialTopics)

  const [sections, setSections] =
    useState<SelectOption[]>(
      initialSections.map((section) => ({
        id: section.id,
        name: section.title,
      }))
    )

  const [sectionId, setSectionId] =
    useState(initialSectionId)

  const [topicId, setTopicId] =
    useState("")

  const [prompt, setPrompt] =
    useState("")

  const [options, setOptions] =
    useState<AnswerOptions>({
      ...EMPTY_OPTIONS,
    })

  const [correctOption, setCorrectOption] =
    useState<AnswerKey | "">("")

  const [points, setPoints] =
    useState("1")

  const [difficulty, setDifficulty] =
    useState<Difficulty>("easy")

  const editable =
    exam.status === "draft" ||
    exam.status === "active"

  const hasDefaults = Boolean(
    exam.default_bank_id &&
    exam.default_category_id
  )

  const returnUrl =
    urls.examDetails(exam.slug)

  const sectionCatalogOptions = useMemo(
    () =>
      organizationSections.map(
        (section) => ({
          id: section.id,
          name: section.title,
        })
      ),
    [organizationSections]
  )

  const allOptionsComplete =
    ANSWER_KEYS.every(
      (key) =>
        options[key].trim().length > 0 &&
        options[key].trim().length <= 2000
    )

  const validPoints =
    points.trim().length > 0 &&
    Number.isFinite(Number(points)) &&
    Number(points) >= 0 &&
    Number(points) <= 1000

  const canSave =
    editable &&
    hasDefaults &&
    Boolean(sectionId) &&
    prompt.trim().length > 0 &&
    prompt.trim().length <= 10000 &&
    allOptionsComplete &&
    Boolean(correctOption) &&
    validPoints &&
    !pending

  const createSection = (name: string) =>
    createExamSectionAction(
      exam.id,
      name
    )

  const useSection = (templateId: string) =>
    addExistingExamSectionAction(
      exam.id,
      templateId
    )

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

  function updateOption(
    key: AnswerKey,
    value: string
  ) {
    setOptions((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function resetQuestionFields() {
    setPrompt("")
    setOptions({
      ...EMPTY_OPTIONS,
    })
    setCorrectOption("")
    setPoints("1")
    setDifficulty("easy")
    setSaveError("")

    // Leave the selected section and optional
    // subtopic intact for the next question.
    formRef.current?.reset()
  }

  function saveQuestion(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!canSave || pending) return

    const nativeEvent =
      event.nativeEvent as SubmitEvent

    const submitter =
      nativeEvent.submitter as
        | HTMLButtonElement
        | null

    const addAnother =
      submitter?.value === "another"

    const formData = new FormData(
      event.currentTarget
    )

    // Explicitly set controlled field values.
    formData.set(
      "section_id",
      sectionId
    )

    formData.set(
      "topic_id",
      topicId
    )

    formData.set(
      "prompt",
      prompt.trim()
    )

    formData.set(
      "correct_option",
      correctOption
    )

    formData.set(
      "difficulty",
      difficulty
    )

    formData.set(
      "points",
      points
    )

    for (const key of ANSWER_KEYS) {
      formData.set(
        `option_${key}`,
        options[key].trim()
      )
    }

    setSaveError("")

    startTransition(async () => {
      try {
        const result =
          await saveExamQuestionAction(
            exam.id,
            exam.slug,
            formData
          )

        if (!result.success) {
          const message =
            result.error ??
            "Unable to save question."

          setSaveError(message)
          toast.error(message)
          return
        }

        toast.success(
          "Question saved successfully."
        )

        if (!addAnother) {
          router.push(returnUrl)
          router.refresh()
          return
        }

        resetQuestionFields()
        router.refresh()

        requestAnimationFrame(() => {
          document
            .getElementById(
              "question-prompt"
            )
            ?.focus()
        })
      } catch (error) {
        console.error(
          "[CBT:SAVE_QUESTION]",
          error
        )

        const message =
          "Unable to save question. Please try again."

        setSaveError(message)
        toast.error(message)
      }
    })
  }

  return (
    <form
      ref={formRef}
      onSubmit={saveQuestion}
      className="space-y-4"
    >
      {/* QUESTION CLASSIFICATION */}
      <section className="space-y-3 rounded-xl border bg-card p-4">
        <SectionTitle
          number={1}
          icon={BookOpen}
          title="Question Classification"
          color="blue"
        />

        <div className="grid gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-foreground/70">
              Question Bank
            </p>

            <p className="mt-1 break-words text-sm font-bold">
              {exam.bank?.name ??
                "Not configured"}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-foreground/70">
              Topic / Bank Category
            </p>

            <p className="mt-1 break-words text-sm font-bold">
              {exam.category?.name ??
                "Not configured"}
            </p>
          </div>
        </div>

        {!hasDefaults && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            Select a question bank and category
            in the examination setup before
            creating questions.
          </div>
        )}

        {!editable && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            This examination is no longer
            available for editing.
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <SelectOrCreateDropdown
            name="section_id"
            label="Examination Section"
            description="Choose or create a section."
            placeholder="Select section"
            createLabel="Create Section"
            value={sectionId}
            options={sections}
            availableOptions={
              sectionCatalogOptions
            }
            onChange={setSectionId}
            onUseAvailable={useSection}
            onCreate={createSection}
            onCreated={(item) => {
              setSections((current) =>
                addOption(current, item)
              )
              setSectionId(item.id)
            }}
            required
            disabled={!editable || pending}
          />

          <SelectOrCreateDropdown
            name="topic_id"
            label="Subtopic (optional)"
            description="For more specific question grouping."
            placeholder="Select subtopic"
            createLabel="Create Subtopic"
            value={topicId}
            options={topics}
            availableOptions={
              organizationTopics
            }
            onChange={setTopicId}
            onUseAvailable={useTopic}
            onCreate={createTopic}
            onCreated={(item) => {
              setTopics((current) =>
                addOption(current, item)
              )
              setTopicId(item.id)
            }}
            disabled={
              !editable ||
              !hasDefaults ||
              pending
            }
          />
        </div>
      </section>

      {/* QUESTION AND OPTIONS */}
      <section className="space-y-4 rounded-xl border bg-card p-4">
        <SectionTitle
          number={2}
          icon={ClipboardList}
          title="Question and Answers"
          color="violet"
        />

        <div className="space-y-1.5">
          <Label
            htmlFor="question-prompt"
            className="text-sm font-semibold"
          >
            Question *
          </Label>

          <Textarea
            id="question-prompt"
            name="prompt"
            value={prompt}
            onChange={(event) =>
              setPrompt(event.target.value)
            }
            placeholder="Type your question here..."
            rows={3}
            maxLength={10000}
            required
            disabled={!editable || pending}
            className="min-h-24 resize-y bg-background text-sm leading-6 shadow-none"
          />
        </div>

        <fieldset className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <legend className="text-sm font-bold">
              Answer Options *
            </legend>

            <Badge
              variant="outline"
              className="border-violet-500/25 bg-violet-500/5 text-xs"
            >
              A, B, C, D
            </Badge>
          </div>

          <p className="text-xs font-medium text-foreground/75">
            Enter four answers, then select
            the correct option using the circle
            beside its letter.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {ANSWER_KEYS.map((key) => {
              const isCorrect =
                correctOption === key

              const letter =
                key.toUpperCase()

              return (
                <div
                  key={key}
                  className={`rounded-xl border p-3 transition-colors ${
                    isCorrect
                      ? "border-emerald-500 bg-emerald-500/5"
                      : "border-border bg-background"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Label
                      htmlFor={`option-${key}`}
                      className="flex items-center gap-2 text-sm font-bold"
                    >
                      <span
                        className={`flex size-7 items-center justify-center rounded-lg ${
                          isCorrect
                            ? "bg-emerald-600 text-white"
                            : "bg-violet-600 text-white"
                        }`}
                      >
                        {letter}
                      </span>

                      Option {letter}
                    </Label>

                    <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
                      <input
                        type="radio"
                        name="correct_option"
                        value={key}
                        checked={isCorrect}
                        onChange={() =>
                          setCorrectOption(key)
                        }
                        disabled={
                          !editable || pending
                        }
                        className="size-4 accent-emerald-600"
                        aria-label={`Mark option ${letter} as the correct answer`}
                      />

                      <span
                        className={
                          isCorrect
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-foreground/70"
                        }
                      >
                        {isCorrect
                          ? "Correct"
                          : "Correct?"}
                      </span>
                    </label>
                  </div>

                  <Textarea
                    id={`option-${key}`}
                    name={`option_${key}`}
                    value={options[key]}
                    onChange={(event) =>
                      updateOption(
                        key,
                        event.target.value
                      )
                    }
                    placeholder={`Enter answer ${letter}`}
                    rows={2}
                    maxLength={2000}
                    required
                    disabled={
                      !editable || pending
                    }
                    className="min-h-[72px] resize-y bg-background text-sm shadow-none"
                  />
                </div>
              )
            })}
          </div>

          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs ${
              correctOption
                ? "border-emerald-500/25 bg-emerald-500/10"
                : "border-amber-500/25 bg-amber-500/10"
            }`}
          >
            {correctOption ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            ) : (
              <Target className="size-4 shrink-0 text-amber-600" />
            )}

            <span className="font-semibold">
              {correctOption
                ? `Correct answer: Option ${correctOption.toUpperCase()}`
                : "Select the correct answer before saving."}
            </span>

            {correctOption && (
              <Check className="ml-auto size-4 text-emerald-600" />
            )}
          </div>
        </fieldset>
      </section>

      {/* MARKING AND EXPLANATION */}
      <section className="space-y-3 rounded-xl border bg-card p-4">
        <SectionTitle
          number={3}
          icon={Target}
          title="Marking Details"
          color="emerald"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="question-points"
              className="text-xs font-semibold"
            >
              Marks *
            </Label>

            <Input
              id="question-points"
              name="points"
              type="number"
              min={0}
              max={1000}
              step="any"
              value={points}
              onChange={(event) =>
                setPoints(
                  event.target.value
                )
              }
              required
              disabled={!editable || pending}
              className="h-10 shadow-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="question-difficulty"
              className="text-xs font-semibold"
            >
              Difficulty *
            </Label>

            <select
              id="question-difficulty"
              name="difficulty"
              value={difficulty}
              onChange={(event) =>
                setDifficulty(
                  event.target.value as Difficulty
                )
              }
              disabled={!editable || pending}
              required
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-50"
            >
              <option value="easy">
                Easy
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="hard">
                Hard
              </option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="question-explanation"
            className="text-xs font-semibold"
          >
            Answer Explanation
            <span className="ml-1 font-normal text-foreground/65">
              (optional)
            </span>
          </Label>

          <Textarea
            id="question-explanation"
            name="explanation"
            placeholder="Explain why the correct option is right..."
            rows={2}
            disabled={!editable || pending}
            className="min-h-16 resize-y text-sm shadow-none"
          />
        </div>
      </section>

      {/* SAVE INFORMATION */}
      <div className="flex items-start gap-2 rounded-lg border border-sky-500/25 bg-sky-500/5 p-3">
        <Info className="mt-0.5 size-4 shrink-0 text-sky-600" />

        <p className="text-xs leading-5 text-foreground/85">
          <strong>Save and reuse:</strong>{" "}
          This question will be added to the
          selected examination section and
          stored in the question bank.

          {exam.status === "active" &&
            " A new exam revision must be published before candidates receive these changes."}
        </p>
      </div>

      {saveError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm font-medium text-destructive"
        >
          {saveError}
        </div>
      )}

      {/* FOOTER */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 sm:p-4">
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
            disabled={!canSave}
            className="border-primary/30 bg-primary/5 font-semibold shadow-none"
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
            disabled={!canSave}
            className="shadow-none"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}

            {pending
              ? "Saving..."
              : "Save Question"}
          </Button>
        </div>
      </div>
    </form>
  )
}
