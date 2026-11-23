
"use client"

import Link from "next/link"
import {
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  ArrowRight,
  BookOpen,
  Check,
  ClipboardList,
  GraduationCap,
  Info,
  Layers3,
  Loader2,
  Users,
  UserRoundCheck,
  ArrowUpRight,
} from "lucide-react"

import { toast } from "react-toastify"

import { urls } from "@/constants"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import SelectOrCreateDropdown, {
  type SelectOption,
} from "@/components/shared/SelectOrCreateDropdown"

import {
  createCategoryAction,
  createExamAction,
  createQuestionBankAction,
  createSchoolExamAction,
  SchoolExamSetupOptions,
} from "../services/action"
import CustomSelect from "@/components/shared/CustomSelect"
import { LinkButton } from "@/components/shared/LinkButton"

type CategoryOption = SelectOption & {
  bank_id: string
}

type Props = {
  banks: SelectOption[]
  categories: CategoryOption[]
  isSchool: boolean
  schoolOptions?: SchoolExamSetupOptions
}

type ExamMode = "school" | "independent"
type TargetScope = "level" | "arms"
type AssignmentScope = "class" | "selected"

const initialState = {
  error: null as string | null,
}

const selectClass =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50"

function SectionHeading({
  number,
  title,
  description,
  icon: Icon,
  color,
}: {
  number: number
  title: string
  description: string
  icon: typeof GraduationCap
  color: "blue" | "violet" | "emerald"
}) {
  const colors = {
    blue: "bg-blue-600 text-white",
    violet: "bg-violet-600 text-white",
    emerald: "bg-emerald-600 text-white",
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${colors[color]}`}
      >
        <Icon className="size-4" />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide text-foreground/65">
            STEP {number}
          </span>

          <h2 className="text-sm font-bold text-foreground sm:text-base">
            {title}
          </h2>
        </div>

        <p className="mt-0.5 text-xs text-foreground/75">
          {description}
        </p>
      </div>
    </div>
  )
}

export default function NewExamForm({
  banks,
  categories,
  isSchool,
  schoolOptions,
}: Props) {
  const action = isSchool
    ? createSchoolExamAction
    : createExamAction

  const [state, formAction, pending] =
    useActionState(action, initialState)

  const [examMode, setExamMode] =
    useState<ExamMode>(
      isSchool ? "school" : "independent"
    )

  const isSchoolExam =
    isSchool && examMode === "school"

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  const [bankId, setBankId] = useState("")
  const [categoryId, setCategoryId] = useState("")

  const [bankOptions, setBankOptions] =
    useState(banks)

  const [categoryOptions, setCategoryOptions] =
    useState(categories)

  const [assignmentScope, setAssignmentScope] =
    useState<AssignmentScope>("class")

  const [targetScope, setTargetScope] =
    useState<TargetScope>("level")

  const [selectedClassIds, setSelectedClassIds] =
    useState<string[]>([])

  const sessions = schoolOptions?.sessions ?? []
  const terms = schoolOptions?.terms ?? []
  const levels = schoolOptions?.levels ?? []
  const classes = schoolOptions?.classes ?? []
  const subjects = schoolOptions?.subjects ?? []
  const offerings = schoolOptions?.offerings ?? []

  const initialSessionId =
    sessions.find((item) => item.is_current)?.id ??
    sessions[0]?.id ??
    ""

  const [sessionId, setSessionId] =
    useState(initialSessionId)

  const [termId, setTermId] = useState("")
  const [levelId, setLevelId] = useState("")
  const [subjectId, setSubjectId] = useState("")

  const availableCategories = useMemo(
    () =>
      categoryOptions.filter(
        (item) => item.bank_id === bankId
      ),
    [categoryOptions, bankId]
  )

  const availableTerms = useMemo(
    () =>
      terms
        .filter(
          (item) => item.session_id === sessionId
        )
        .sort(
          (a, b) => a.position - b.position
        ),
    [terms, sessionId]
  )

  const resolvedTermId =
    availableTerms.some((item) => item.id === termId)
      ? termId
      : availableTerms.find(
          (item) => item.is_current
        )?.id ??
        availableTerms[0]?.id ??
        ""

  const availableLevels = useMemo(() => {
    const ids = new Set(
      classes
        .filter(
          (item) => item.session_id === sessionId
        )
        .map((item) => item.level_id)
    )

    return levels.filter(
      (item) => ids.has(item.id)
    )
  }, [classes, levels, sessionId])

  const levelClasses = useMemo(
    () =>
      classes.filter(
        (item) =>
          item.session_id === sessionId &&
          item.level_id === levelId
      ),
    [classes, sessionId, levelId]
  )

  const levelOfferings = useMemo(
    () =>
      offerings.filter(
        (item) =>
          item.session_id === sessionId &&
          item.term_id === resolvedTermId &&
          levelClasses.some(
            (cls) => cls.id === item.class_id
          )
      ),
    [
      offerings,
      sessionId,
      resolvedTermId,
      levelClasses,
    ]
  )

  const availableSubjects = useMemo(() => {
    const ids = new Set(
      levelOfferings.map(
        (item) => item.subject_id
      )
    )

    return subjects.filter(
      (item) => ids.has(item.id)
    )
  }, [subjects, levelOfferings])

  const validSubjectId =
    availableSubjects.some(
      (item) => item.id === subjectId
    )
      ? subjectId
      : ""

  const subjectOfferings = useMemo(
    () =>
      levelOfferings.filter(
        (item) =>
          item.subject_id === validSubjectId
      ),
    [levelOfferings, validSubjectId]
  )

  const eligibleClassIds = useMemo(
    () =>
      new Set(
        subjectOfferings.map(
          (item) => item.class_id
        )
      ),
    [subjectOfferings]
  )

  const allArmsCovered =
    levelClasses.length > 0 &&
    levelClasses.every(
      (item) =>
        eligibleClassIds.has(item.id)
    )

  const actualSelectedClassIds =
    targetScope === "level"
      ? levelClasses.map((item) => item.id)
      : selectedClassIds.filter(
          (id) => eligibleClassIds.has(id)
        )

  const selectedClassIdSet = new Set(
    actualSelectedClassIds
  )

  const selectedOfferingIds = subjectOfferings
    .filter(
      (item) =>
        selectedClassIdSet.has(item.class_id)
    )
    .map((item) => item.id)

  const selectedClassNames = levelClasses
    .filter((item) =>
      selectedClassIdSet.has(item.id)
    )
    .map((item) => item.name)

  const canUseSchoolCoverage =
    Boolean(sessionId) &&
    Boolean(resolvedTermId) &&
    Boolean(levelId) &&
    Boolean(validSubjectId) &&
    actualSelectedClassIds.length > 0 &&
    actualSelectedClassIds.length <= 100 &&
    selectedOfferingIds.length ===
      actualSelectedClassIds.length &&
    (
      targetScope === "arms" ||
      allArmsCovered
    )

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
  }, [state])

  function resetCoverage() {
    setLevelId("")
    setSubjectId("")
    setTargetScope("level")
    setSelectedClassIds([])
  }

  function changeSession(value: string) {
    setSessionId(value)
    setTermId("")
    resetCoverage()
  }

  function changeTerm(value: string) {
    setTermId(value)
    resetCoverage()
  }

  function changeLevel(value: string) {
    setLevelId(value)
    setSubjectId("")
    setTargetScope("level")
    setSelectedClassIds([])
  }

  function changeSubject(value: string) {
    setSubjectId(value)
    setSelectedClassIds([])
  }

  function toggleClass(
    id: string,
    checked: boolean
  ) {
    setSelectedClassIds((current) =>
      checked
        ? [...new Set([...current, id])]
        : current.filter(
            (item) => item !== id
          )
    )
  }

  function changeBank(value: string) {
    if (value === bankId) return
    setBankId(value)
    setCategoryId("")
  }

  function addBank(option: SelectOption) {
    setBankOptions((current) =>
      current.some(
        (item) => item.id === option.id
      )
        ? current
        : [...current, option].sort(
            (a, b) =>
              a.name.localeCompare(b.name)
          )
    )
  }

  function addCategory(option: SelectOption) {
    setCategoryOptions((current) => {
      if (
        current.some(
          (item) => item.id === option.id
        )
      ) {
        return current
      }

      return [
        ...current,
        { ...option, bank_id: bankId },
      ].sort(
        (a, b) => a.name.localeCompare(b.name)
      )
    })
  }

  const canSubmit =
    !pending &&
    title.trim().length >= 2 &&
    title.trim().length <= 200 &&
    description.length <= 1000 &&
    Boolean(bankId) &&
    Boolean(categoryId) &&
    (
      !isSchoolExam ||
      canUseSchoolCoverage
    )

  return (
    <form action={formAction}>
      {isSchool && (
        <input
          type="hidden"
          name="exam_mode"
          value={examMode}
        />
      )}

      {isSchoolExam && (
        <>
          <input
            type="hidden"
            name="target_scope"
            value={targetScope}
          />

          {selectedOfferingIds.map(
            (id) => (
              <input
                key={id}
                type="hidden"
                name="school_offering_ids"
                value={id}
              />
            )
          )}
        </>
      )}

      <div className="overflow-hidden rounded-xl border bg-card">
        {/* HEADER */}
        <div className="flex items-center justify-between gap-3 border-b bg-primary/5 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <ClipboardList className="size-4 text-primary" />

            <span className="text-sm font-semibold">
              {isSchoolExam
                ? "School Examination Setup"
                : "Test Setup"}
            </span>
          </div>

          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
            NEW DRAFT
          </span>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          {/* EXAMINATION TYPE */}
          {isSchool && (
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <Layers3 className="size-4 text-primary" />
                <h2 className="text-sm font-bold">
                  Examination Type
                </h2>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    setExamMode("school")
                  }
                  aria-pressed={examMode === "school"}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    examMode === "school"
                      ? "border-blue-500 bg-blue-500/10"
                      : "hover:border-primary/40"
                  }`}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <GraduationCap className="size-5" />
                  </div>

                  <span className="min-w-0">
                    <span className="block text-sm font-bold">
                      School Examination
                    </span>

                    <span className="block text-xs text-foreground/75">
                      Academic session, class and subject
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    setExamMode("independent")
                  }
                  aria-pressed={
                    examMode === "independent"
                  }
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    examMode === "independent"
                      ? "border-violet-500 bg-violet-500/10"
                      : "hover:border-primary/40"
                  }`}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
                    <ClipboardList className="size-5" />
                  </div>

                  <span className="min-w-0">
                    <span className="block text-sm font-bold">
                      Independent Test
                    </span>

                    <span className="block text-xs text-foreground/75">
                      General CBT without school linkage
                    </span>
                  </span>
                </button>
              </div>
            </section>
          )}

          {/* SCHOOL ACADEMIC DETAILS */}
          {isSchoolExam && (
            <section className="space-y-3">
              <SectionHeading
                number={1}
                icon={GraduationCap}
                title="Academic Details"
                description="Choose the level and class arms covered by this examination."
                color="blue"
              />

              <div className="space-y-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.035] p-3 sm:p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <CustomSelect
                    label="Academic Session"
                    name="school-session"
                    value={sessionId}
                    onChange={changeSession}
                    disabled={pending}
                    required
                    options={[
                      { label: "Select session", value: "" },
                      ...sessions.map((session) => ({
                        label: `${session.name}${session.is_current ? " (Current)" : ""}`,
                        value: session.id,
                      })),
                    ]}
                  />

                  <CustomSelect
                    label="Academic Term"
                    name="school-term"
                    value={resolvedTermId}
                    onChange={changeTerm}
                    disabled={pending || !sessionId}
                    required
                    options={[
                      { label: "Select term", value: "" },
                      ...availableTerms.map((term) => ({
                        label: `${term.name}${term.is_current ? " (Current)" : ""}`,
                        value: term.id,
                      })),
                    ]}
                  />

                  <CustomSelect
                    label="Class Level"
                    name="school-level"
                    value={levelId}
                    onChange={changeLevel}
                    disabled={pending || !resolvedTermId}
                    required
                    options={[
                      { label: "Select level", value: "" },
                      ...availableLevels.map((level) => ({
                        label: level.name,
                        value: level.id,
                      })),
                    ]}
                  />

                  <div className="space-y-1.5">
                    <CustomSelect
                      label="School Subject"
                      name="school-subject"
                      value={validSubjectId}
                      onChange={changeSubject}
                      disabled={pending || !levelId}
                      required
                      options={[
                        { label: "Select subject", value: "" },
                        ...availableSubjects.map((subject) => ({
                          label: subject.name,
                          value: subject.id,
                        })),
                      ]}
                    />

                    {levelId && availableSubjects.length === 0 && (
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                        No subject offerings are configured for this level and term.
                      </p>
                    )}
                  </div>
                </div>

                {/* CLASS COVERAGE */}
                {validSubjectId && (
                  <div className="space-y-3 border-t border-blue-500/15 pt-3">
                    <div>
                      <p className="text-sm font-bold">
                        Class Coverage
                      </p>
                      <p className="mt-0.5 text-xs text-foreground/75">
                        Choose all class arms or only specific arms.
                      </p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          setTargetScope("level")
                        }
                        aria-pressed={
                          targetScope === "level"
                        }
                        className={`rounded-lg border p-3 text-left ${
                          targetScope === "level"
                            ? "border-blue-500 bg-blue-500/10"
                            : "bg-background hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Users className="size-4 text-blue-600" />
                          <span className="text-sm font-semibold">
                            Entire Level
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-foreground/75">
                          All {levelClasses.length} class arm(s)
                        </p>
                      </button>

                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          setTargetScope("arms")
                        }
                        aria-pressed={
                          targetScope === "arms"
                        }
                        className={`rounded-lg border p-3 text-left ${
                          targetScope === "arms"
                            ? "border-violet-500 bg-violet-500/10"
                            : "bg-background hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <UserRoundCheck className="size-4 text-violet-600" />
                          <span className="text-sm font-semibold">
                            Selected Arms
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-foreground/75">
                          Choose one or more classes
                        </p>
                      </button>
                    </div>

                    {targetScope === "level" ? (
                      <div className="rounded-lg border bg-background p-3">
                        <p className="text-xs font-semibold">
                          {allArmsCovered
                            ? "All class arms have the selected subject."
                            : "Subject coverage is incomplete."}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {levelClasses.map((cls) => (
                            <span
                              key={cls.id}
                              className={`rounded-md border px-2 py-1 text-xs font-medium ${
                                eligibleClassIds.has(cls.id)
                                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                  : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                              }`}
                            >
                              {cls.name}
                              {!eligibleClassIds.has(cls.id)
                                ? " · Not offered"
                                : ""}
                            </span>
                          ))}
                        </div>

                        {!allArmsCovered && (
                          <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                            Configure this subject for every
                            arm before creating an entire-level
                            examination, or use Selected Arms.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-lg border bg-background p-3">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold">
                            Select class arms
                          </p>

                          <button
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              setSelectedClassIds(
                                levelClasses
                                  .filter((cls) =>
                                    eligibleClassIds.has(cls.id)
                                  )
                                  .map((cls) => cls.id)
                              )
                            }
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            Select eligible
                          </button>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {levelClasses.map((cls) => {
                            const eligible =
                              eligibleClassIds.has(cls.id)

                            const checked =
                              selectedClassIds.includes(cls.id)

                            return (
                              <label
                                key={cls.id}
                                className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs ${
                                  eligible
                                    ? "cursor-pointer hover:border-primary/40"
                                    : "cursor-not-allowed opacity-60"
                                } ${
                                  checked
                                    ? "border-violet-500 bg-violet-500/10"
                                    : ""
                                }`}
                              >
                                <Checkbox
                                  checked={checked && eligible}
                                  disabled={pending || !eligible}
                                  onCheckedChange={(value) =>
                                    toggleClass(
                                      cls.id,
                                      value === true
                                    )
                                  }
                                />

                                <span className="min-w-0 flex-1 font-medium">
                                  {cls.name}
                                </span>

                                {checked && eligible && (
                                  <Check className="size-3 text-violet-600" />
                                )}
                              </label>
                            )
                          })}
                        </div>

                        <p className="mt-2 text-xs text-foreground/75">
                          {actualSelectedClassIds.length} arm(s)
                          selected.
                          {" "}Unconfigured subject offerings
                          cannot be selected.
                        </p>
                      </div>
                    )}

                    {canUseSchoolCoverage && (
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                        <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                          One exam covering{" "}
                          {actualSelectedClassIds.length}{" "}
                          class arm(s)
                        </p>

                        <p className="mt-1 text-xs text-foreground/80">
                          {selectedClassNames.join(", ")}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <LinkButton href={urls.schoolAcademicSetup} size={"sm"} variant={"link"}>
                        Update Academic setup <ArrowUpRight size={16}/>
                      </LinkButton>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* EXAM DETAILS */}
          <section className="space-y-3">
            <SectionHeading
              number={isSchoolExam ? 2 : 1}
              icon={ClipboardList}
              title={
                isSchoolExam
                  ? "Examination Details"
                  : "Test Information"
              }
              description={
                isSchoolExam
                  ? "Name the examination and choose the student assignment method."
                  : "Provide the title and purpose of the test."
              }
              color="violet"
            />

            <div className="space-y-3 rounded-xl border border-violet-500/20 bg-violet-500/[0.035] p-3 sm:p-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="exam-title"
                  className="text-xs font-semibold"
                >
                  {isSchoolExam
                    ? "Examination Title"
                    : "Test Title"} *
                </Label>

                <Input
                  id="exam-title"
                  name="title"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder={
                    isSchoolExam
                      ? "e.g. JSS 1 Mathematics First Term Exam"
                      : "e.g. Mathematics Practice Test"
                  }
                  required
                  minLength={2}
                  maxLength={200}
                  disabled={pending}
                  className="h-10 bg-background font-medium shadow-none"
                />
              </div>

              {isSchoolExam && (
                <fieldset className="space-y-2">
                  <legend className="text-xs font-semibold">
                    Student Assignment
                  </legend>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                        assignmentScope === "class"
                          ? "border-blue-500 bg-blue-500/10"
                          : "bg-background"
                      }`}
                    >
                      <input
                        type="radio"
                        name="assignment_scope"
                        value="class"
                        checked={assignmentScope === "class"}
                        onChange={() =>
                          setAssignmentScope("class")
                        }
                        disabled={pending}
                        className="accent-blue-600"
                      />

                      <Users className="size-4 text-blue-600" />

                      <span>
                        <span className="block text-sm font-semibold">
                          All Eligible Students
                        </span>

                        <span className="block text-[11px] text-foreground/75">
                          Across covered class arms
                        </span>
                      </span>
                    </label>

                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                        assignmentScope === "selected"
                          ? "border-violet-500 bg-violet-500/10"
                          : "bg-background"
                      }`}
                    >
                      <input
                        type="radio"
                        name="assignment_scope"
                        value="selected"
                        checked={
                          assignmentScope === "selected"
                        }
                        onChange={() =>
                          setAssignmentScope("selected")
                        }
                        disabled={pending}
                        className="accent-violet-600"
                      />

                      <UserRoundCheck className="size-4 text-violet-600" />

                      <span>
                        <span className="block text-sm font-semibold">
                          Selected Students
                        </span>

                        <span className="block text-[11px] text-foreground/75">
                          Choose individual students later
                        </span>
                      </span>
                    </label>
                  </div>
                </fieldset>
              )}

              <div className="space-y-1.5">
                <Label
                  htmlFor="exam-description"
                  className="text-xs font-semibold"
                >
                  Description (optional)
                </Label>

                <Textarea
                  id="exam-description"
                  name="description"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Short details about this examination..."
                  rows={2}
                  maxLength={1000}
                  disabled={pending}
                  className="min-h-16 resize-y bg-background shadow-none"
                />
              </div>
            </div>
          </section>

          {/* QUESTION ORGANIZATION */}
          <section className="space-y-3">
            <SectionHeading
              number={isSchoolExam ? 3 : 2}
              icon={BookOpen}
              title="Question Organization"
              description="Choose the bank and topic for examination questions."
              color="emerald"
            />

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.035] p-3 sm:p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectOrCreateDropdown
                  name="default_bank_id"
                  label="Question Bank"
                  description="Choose or create a question bank."
                  placeholder="Select question bank"
                  createLabel="Create Question Bank"
                  value={bankId}
                  options={bankOptions}
                  onChange={changeBank}
                  onCreate={(name) =>
                    createQuestionBankAction(name)
                  }
                  onCreated={addBank}
                  required
                  disabled={pending}
                />

                <SelectOrCreateDropdown
                  name="default_category_id"
                  label="Topic"
                  description="Choose a topic in the question bank."
                  placeholder={
                    bankId
                      ? "Select topic"
                      : "Select a bank first"
                  }
                  createLabel="Create Topic"
                  value={categoryId}
                  options={availableCategories}
                  onChange={setCategoryId}
                  onCreate={(name) =>
                    createCategoryAction(bankId, name)
                  }
                  onCreated={addCategory}
                  required
                  disabled={pending || !bankId}
                />
              </div>
            </div>
          </section>

          <div className="flex items-start gap-2 rounded-lg border border-sky-500/25 bg-sky-500/5 p-3">
            <Info className="mt-0.5 size-4 shrink-0 text-sky-600" />

            <p className="text-xs leading-5 text-foreground/85">
              <strong>Next:</strong> Save this{" "}
              {isSchoolExam
                ? "school examination"
                : "test"}{" "}
              as a draft. Add questions, configure
              the settings and publish it.

              {isSchoolExam
                ? " Student assignments will be managed separately."
                : ""}
            </p>
          </div>

          {state.error && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm font-medium text-destructive"
            >
              {state.error}
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-4 py-4 sm:px-5">
          <Button
            type="button"
            variant="outline"
            asChild
            className="shadow-none"
          >
            <Link href={urls.exams}>
              Cancel
            </Link>
          </Button>

          <Button
            type="submit"
            disabled={!canSubmit}
            className="min-w-[190px] shadow-none"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Save {isSchoolExam
                  ? "Examination"
                  : "Test"} Draft

                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
