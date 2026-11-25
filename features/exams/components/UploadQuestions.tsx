
"use client"

import Link from "next/link"
import {
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"

import { useRouter } from "next/navigation"
import { toast } from "react-toastify"

import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardPaste,
  Copy,
  Download,
  FileCheck2,
  FileText,
  FileUp,
  Info,
  Layers3,
  Loader2,
  RotateCcw,
  Save,
  Upload,
} from "lucide-react"

import { urls } from "@/constants"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import SelectOrCreateDropdown from
  "@/components/shared/SelectOrCreateDropdown"

import { RichTextEditor } from
  "@/components/shared/RichTextEditor"

import type {
  ImportOption,
} from "@/types/question-import"

import {
  useQuestionImport,
} from "../context/QuestionImportProvider"

import {
  getImportIssues,
} from "../services/import-validation"

import {
  extractQuestionsAction,
  saveImportedQuestionsAction,
} from "../services/action"

import {
  addExistingExamSectionAction,
  createExamSectionAction,
  createTopicAction,
  useOrganizationTopicAction,
} from "../services/action.examSections"

import {
  getImportCatalogOptionsAction,
} from "../services/action.importCatalog"

import {
  richTextToQuestionText,
} from "../services/rich-text-to-questions"

import {
  ImportedQuestionList,
} from "./ImportedQuestionList"

type Props = {
  examId: string
  slug: string
  title: string
  bankName: string
  categoryName: string
  bankId: string
  categoryId: string
  initialTopics: ImportOption[]
  initialSections: {
    id: string
    title: string
    position: number
  }[]
  initialSectionId?: string
  editable: boolean
}

type Source = "paste" | "document"

type Confirmation = "replace" | "discard" | null

type CatalogOption = {
  id: string
  name: string
}

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_BATCH_SIZE = 100

const SAMPLE_QUESTIONS = `1. What is 12 × 5?
A. 50
B. 55
C. 60
D. 65
Answer: C
Explanation: 12 multiplied by 5 equals 60.

2. What is the capital of Nigeria?
A. Lagos
B. Abuja
C. Kano
D. Ibadan
Answer: B`

function addOption(
  current: ImportOption[],
  option: ImportOption
): ImportOption[] {
  if (
    current.some(
      (item) => item.id === option.id
    )
  ) {
    return current
  }

  return [...current, option].sort(
    (a, b) => a.name.localeCompare(b.name)
  )
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "blue" | "green" | "amber" | "violet"
}) {
  const colors = {
    blue:
      "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-300",
    green:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
    amber:
      "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300",
    violet:
      "border-violet-500/25 bg-violet-500/10 text-violet-800 dark:text-violet-300",
  }

  return (
    <div
      className={`rounded-lg border px-3 py-2 ${colors[tone]}`}
    >
      <p className="text-[11px] font-semibold">
        {label}
      </p>

      <p className="mt-0.5 text-xl font-bold tabular-nums">
        {value}
      </p>
    </div>
  )
}

export function UploadQuestions({
  examId,
  slug,
  title,
  bankName,
  categoryName,
  bankId,
  categoryId,
  initialTopics,
  initialSections,
  initialSectionId = "",
  editable,
}: Props) {
  const router = useRouter()

  const fileInput =
    useRef<HTMLInputElement>(null)

  const {
    questions,
    ready,
    setExtracted,
    assignAll,
    markSaved,
    clearDraft,
  } = useQuestionImport()

  const [source, setSource] =
    useState<Source>("paste")

  const [file, setFile] =
    useState<File | null>(null)

  const [pastedText, setPastedText] =
    useState("")

  const [error, setError] =
    useState("")

  const [
    extractionWarnings,
    setExtractionWarnings,
  ] = useState<string[]>([])

  const [
    extracting,
    startExtraction,
  ] = useTransition()

  const [saving, setSaving] =
    useState(false)

  const [
    confirmation,
    setConfirmation,
  ] = useState<Confirmation>(null)

  const [sections, setSections] =
    useState<ImportOption[]>(
      initialSections.map((section) => ({
        id: section.id,
        name: section.title,
      }))
    )

  const [topics, setTopics] =
    useState<ImportOption[]>(initialTopics)

  const [
    defaultSectionId,
    setDefaultSectionId,
  ] = useState(initialSectionId)

  const [
    defaultTopicId,
    setDefaultTopicId,
  ] = useState("")

  const [
    organizationSections,
    setOrganizationSections,
  ] = useState<CatalogOption[]>([])

  const [
    organizationTopics,
    setOrganizationTopics,
  ] = useState<CatalogOption[]>([])

  const [
    catalogLoaded,
    setCatalogLoaded,
  ] = useState(false)

  const [
    catalogLoading,
    setCatalogLoading,
  ] = useState(false)

  const [templateBusy, setTemplateBusy] =
    useState(false)

  const busy =
    extracting || saving || templateBusy

  const unsavedQuestions = useMemo(
    () =>
      questions.filter(
        (question) => !question.saved
      ),
    [questions]
  )

  const readyToSave = useMemo(
    () =>
      unsavedQuestions.filter(
        (question) =>
          getImportIssues(question).length === 0
      ),
    [unsavedQuestions]
  )

  const needsReview = useMemo(
    () =>
      unsavedQuestions.filter(
        (question) =>
          getImportIssues(question).length > 0
      ),
    [unsavedQuestions]
  )

  const savedCount =
    questions.length - unsavedQuestions.length

  const savingCount = Math.min(
    readyToSave.length,
    MAX_BATCH_SIZE
  )

  const canExtract =
    editable &&
    ready &&
    !busy &&
    (
      source === "document"
        ? file !== null
        : pastedText.trim().length > 0
    )

  const hasDefaults =
    Boolean(bankId) &&
    Boolean(categoryId)

  async function loadCatalogs() {
    if (
      catalogLoaded ||
      catalogLoading
    ) {
      return
    }

    setCatalogLoading(true)

    try {
      const result =
        await getImportCatalogOptionsAction()

      if (!result.success) {
        toast.error(
          result.error ??
            "Unable to load reusable sections and topics."
        )
        return
      }

      setOrganizationSections(
        result.sections
      )

      setOrganizationTopics(
        result.topics
      )

      setCatalogLoaded(true)
    } catch (cause) {
      console.error(
        "[CBT:IMPORT_CATALOGS]",
        cause
      )

      toast.error(
        "Unable to load reusable options."
      )
    } finally {
      setCatalogLoading(false)
    }
  }

  function clearFile() {
    setFile(null)
    setError("")

    if (fileInput.current) {
      fileInput.current.value = ""
    }
  }

  async function copyTemplate() {
    try {
      await navigator.clipboard.writeText(
        SAMPLE_QUESTIONS
      )

      toast.success(
        "Question format copied."
      )
    } catch {
      toast.error(
        "Unable to copy the question format."
      )
    }
  }

  async function createWordFile(
    text: string,
    filename: string
  ): Promise<File> {
    const {
      Document,
      Packer,
      Paragraph,
    } = await import("docx")

    const lines = text
      .replace(/\r\n?/g, "\n")
      .split("\n")

    const document = new Document({
      sections: [
        {
          properties: {},
          children: lines.map(
            (line) =>
              new Paragraph({
                text: line || " ",
              })
          ),
        },
      ],
    })

    const blob =
      await Packer.toBlob(document)

    return new File(
      [blob],
      filename,
      {
        type:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }
    )
  }

  async function downloadTemplate() {
    if (templateBusy) return

    setTemplateBusy(true)

    try {
      const templateFile =
        await createWordFile(
          SAMPLE_QUESTIONS,
          "CBT-Question-Import-Template.docx"
        )

      const url =
        URL.createObjectURL(templateFile)

      const anchor =
        document.createElement("a")

      anchor.href = url
      anchor.download = templateFile.name

      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()

      // Revoke after the download has been
      // initiated, not before the anchor click.
      window.setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)

      toast.success(
        "Word question template prepared."
      )
    } catch (cause) {
      console.error(
        "[CBT:WORD_TEMPLATE]",
        cause
      )

      toast.error(
        "Unable to generate the Word template."
      )
    } finally {
      setTemplateBusy(false)
    }
  }

  function performExtract() {
    if (
      busy ||
      !editable ||
      !ready
    ) {
      return
    }

    setError("")
    setExtractionWarnings([])

    startExtraction(async () => {
      try {
        let documentFile: File

        if (source === "document") {
          if (!file) {
            setError(
              "Choose a Word document."
            )
            return
          }

          if (
            !file.name
              .toLowerCase()
              .endsWith(".docx")
          ) {
            setError(
              "Only .docx documents are supported."
            )
            return
          }

          documentFile = file
        } else {
          const plainText =
            richTextToQuestionText(
              pastedText
            )

          if (
            plainText.trim().length < 20
          ) {
            setError(
              "Paste complete questions with options A–D and an Answer line."
            )
            return
          }

          if (
            plainText.length > 100_000
          ) {
            setError(
              "The pasted content is too long. Import a smaller batch."
            )
            return
          }

          documentFile =
            await createWordFile(
              plainText,
              "pasted-questions.docx"
            )
        }

        if (
          documentFile.size === 0 ||
          documentFile.size > MAX_FILE_SIZE
        ) {
          setError(
            "The Word document must not exceed 5 MB."
          )
          return
        }

        const formData =
          new FormData()

        formData.set(
          "file",
          documentFile
        )

        const result =
          await extractQuestionsAction(
            slug,
            formData
          )

        if (!result.success) {
          const message =
            result.error ??
            "Unable to extract questions."

          setError(message)
          toast.error(message)
          return
        }

        if (
          result.questions.length === 0
        ) {
          setError(
            "No questions were recognized. Check the numbering, A–D options and answer lines."
          )
          return
        }

        // Replaces only unsaved import items.
        // Existing saved records are preserved.
        setExtracted(result.questions, {
          sectionId: defaultSectionId,
          topicId: defaultTopicId,
        })

        setExtractionWarnings(
          result.warnings ?? []
        )

        toast.success(
          `${result.questions.length} question(s) extracted. Review them before saving.`
        )
      } catch (cause) {
        console.error(
          "[CBT:EXTRACT_QUESTIONS]",
          cause
        )

        setError(
          "Unable to process the questions. Please try again."
        )

        toast.error(
          "Question extraction failed."
        )
      }
    })
  }

  function extract() {
    if (!canExtract) return

    if (
      unsavedQuestions.length > 0
    ) {
      setConfirmation("replace")
      return
    }

    performExtract()
  }

  function assignSection(id: string) {
    setDefaultSectionId(id)
    assignAll("sectionId", id)
  }

  function assignTopic(id: string) {
    setDefaultTopicId(id)
    assignAll("topicId", id)
  }

  async function saveReviewed() {
    if (
      !ready ||
      busy ||
      !editable ||
      readyToSave.length === 0
    ) {
      return
    }

    const batch =
      readyToSave.slice(
        0,
        MAX_BATCH_SIZE
      )

    setSaving(true)

    try {
      const result =
        await saveImportedQuestionsAction(
          examId,
          slug,
          batch.map((question) => ({
            id: question.id,
            sectionId:
              question.sectionId,
            topicId:
              question.topicId,
            prompt:
              question.prompt,
            options:
              question.options,
            correctOption:
              question.correctOption,
            explanation:
              question.explanation,
            difficulty:
              question.difficulty,
            points:
              question.points,
          }))
        )

      if (result.savedIds.length > 0) {
        markSaved(result.savedIds)

        toast.success(
          `${result.savedIds.length} question(s) saved successfully.`
        )

        router.refresh()
      }

      if (result.error) {
        toast.error(result.error)
      }

      // Leave the review open when some
      // unsaved questions still need saving.
      const allUnsavedSaved =
        result.savedIds.length ===
          unsavedQuestions.length &&
        !result.error

      if (allUnsavedSaved) {
        router.push(
          urls.examDetails(slug)
        )
        router.refresh()
        return
      }

      if (
        !result.error &&
        result.savedIds.length > 0
      ) {
        toast.info(
          "The remaining questions are still in your review. Continue with the next batch."
        )
      }
    } catch (cause) {
      console.error(
        "[CBT:SAVE_IMPORTED_QUESTIONS]",
        cause
      )

      toast.error(
        "Unable to confirm the save result. Check the examination before retrying to avoid duplicates."
      )
    } finally {
      setSaving(false)
    }
  }

  function confirmAction() {
    if (busy) return

    const action = confirmation
    setConfirmation(null)

    if (action === "replace") {
      performExtract()
      return
    }

    if (action === "discard") {
      clearDraft()
      setExtractionWarnings([])
      clearFile()
      setPastedText("")
      setError("")

      toast.info(
        "Local import draft cleared. Saved examination questions were not deleted."
      )
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 pb-24">
      {/* PAGE NAVIGATION */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={urls.examDetails(slug)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/80 hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Exam Questions
        </Link>

        <Badge
          variant="outline"
          className="border-violet-500/30 bg-violet-500/10 font-semibold text-violet-700 dark:text-violet-300"
        >
          Bulk Import
        </Badge>
      </div>

      {/* HEADER */}
      <header className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-start justify-between gap-3 bg-primary/5 p-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
              <FileUp className="size-5" />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight">
                Import Questions
              </h1>

              <p className="mt-1 break-words text-sm font-semibold text-foreground/85">
                {title}
              </p>

              <p className="mt-1 text-xs text-foreground/75">
                Upload or paste, review,
                then save to your examination.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={templateBusy}
              onClick={() =>
                void downloadTemplate()
              }
              className="bg-background shadow-none"
            >
              {templateBusy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}

              Word Template
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                void copyTemplate()
              }
              className="bg-background shadow-none"
            >
              <Copy className="size-4" />
              Copy Format
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t px-4 py-2.5 text-xs">
          <BookOpen className="size-4 text-emerald-600" />

          <span className="font-semibold">
            {bankName}
          </span>

          <span className="text-foreground/50">
            /
          </span>

          <span className="font-semibold">
            {categoryName}
          </span>
        </div>
      </header>


      {/* IMPORT SOURCE */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-blue-500/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-blue-600" />

            <h2 className="text-sm font-bold">
              Import Source
            </h2>
          </div>

          <span className="text-xs font-semibold text-foreground/70">
            Choose one method
          </span>
        </div>

        <div className="space-y-4 p-4">
          {/* SOURCE SWITCH */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setSource("paste")
                setError("")
              }}
              aria-pressed={
                source === "paste"
              }
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                source === "paste"
                  ? "border-blue-500 bg-blue-500/10 text-blue-800 dark:text-blue-300"
                  : "bg-background hover:border-primary/40"
              } disabled:opacity-50`}
            >
              <ClipboardPaste className="size-4" />
              Paste / Type
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setSource("document")
                setError("")
              }}
              aria-pressed={
                source === "document"
              }
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                source === "document"
                  ? "border-blue-500 bg-blue-500/10 text-blue-800 dark:text-blue-300"
                  : "bg-background hover:border-primary/40"
              } disabled:opacity-50`}
            >
              <Upload className="size-4" />
              Upload Word
            </button>
          </div>

          {source === "paste" ? (
            <div className="space-y-2">
              <RichTextEditor
                variant="exam"
                label="Paste Questions"
                value={pastedText}
                onChange={setPastedText}
                placeholder="Paste or type your questions here..."
                minHeight={220}
                disabled={!editable || busy}
              />

              <p className="text-xs leading-5 text-foreground/75">
                Use numbered questions,
                options A–D and an
                Answer line for each question.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label
                className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-blue-500/30 bg-blue-500/5 px-5 py-7 text-center transition-colors hover:bg-blue-500/10 ${
                  !editable || busy
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer"
                }`}
              >
                <div className="flex size-11 items-center justify-center rounded-xl bg-background text-blue-600">
                  <Upload className="size-5" />
                </div>

                <span className="max-w-full break-all text-sm font-semibold">
                  {file?.name ??
                    "Choose a Word document"}
                </span>

                <span className="text-xs font-medium text-foreground/75">
                  .docx only · Maximum 5 MB
                </span>

                <input
                  ref={fileInput}
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="sr-only"
                  disabled={!editable || busy}
                  onChange={(event) => {
                    setFile(
                      event.target.files?.[0] ??
                        null
                    )

                    setError("")
                  }}
                />
              </label>

              {file && (
                <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileCheck2 className="size-4 shrink-0 text-emerald-600" />

                    <span className="truncate text-xs font-medium">
                      {file.name}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={clearFile}
                    className="shrink-0 shadow-none"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* COMPACT FORMAT GUIDE */}
          <details className="group rounded-lg border border-sky-500/25 bg-sky-500/5">
            <summary className="cursor-pointer px-3 py-2.5 text-xs font-bold text-sky-800 dark:text-sky-300">
              View required A–D question format
            </summary>

            <div className="border-t border-sky-500/20 px-3 py-3">
              <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs leading-5 text-foreground/85">
                {SAMPLE_QUESTIONS}
              </pre>

              <p className="mt-2 text-xs leading-5 text-foreground/75">
                Every question should include
                options A, B, C and D, followed
                by an answer such as Answer: C.
                The explanation is optional.
              </p>
            </div>
          </details>

          {!hasDefaults && (
            <div
              role="alert"
              className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-sm font-medium text-amber-900 dark:text-amber-300"
            >
              This examination needs a valid
              question bank and category
              before importing questions.
            </div>
          )}

          {!editable && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"
            >
              This examination is not
              available for editing.
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
            <p className="text-xs text-foreground/70">
              You can edit the extracted
              questions before saving.
            </p>

            <Button
              type="button"
              onClick={extract}
              disabled={
                !canExtract ||
                !hasDefaults
              }
              className="shadow-none"
            >
              {extracting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileText className="size-4" />
              )}

              {extracting
                ? "Extracting..."
                : "Extract Questions"}
            </Button>
          </div>
        </div>
      </section>

      {/* LOADING LOCAL DRAFT */}
      {!ready && (
        <div className="flex items-center justify-center gap-2 rounded-xl border py-8 text-sm font-medium">
          <Loader2 className="size-4 animate-spin" />
          Restoring your import draft...
        </div>
      )}

      {/* REVIEW WORKSPACE */}
      {ready && questions.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Layers3 className="size-5 text-violet-600" />
                Review Questions
              </h2>

              <p className="text-xs font-medium text-foreground/75">
                Review answers, adjust marks,
                and assign sections before saving.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="border-sky-500/30 bg-sky-500/10"
              >
                {questions.length} total
              </Badge>

              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              >
                {readyToSave.length} ready
              </Badge>

              {needsReview.length > 0 && (
                <Badge
                  variant="outline"
                  className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                >
                  {needsReview.length} need attention
                </Badge>
              )}
            </div>
          </div>

          {/* COUNTS */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <SummaryStat
              label="Imported"
              value={questions.length}
              tone="blue"
            />

            <SummaryStat
              label="Ready"
              value={readyToSave.length}
              tone="green"
            />

            <SummaryStat
              label="Needs Review"
              value={needsReview.length}
              tone="amber"
            />

            <SummaryStat
              label="Saved"
              value={savedCount}
              tone="violet"
            />
          </div>

          {/* EXTRACTION WARNINGS */}
          {extractionWarnings.length > 0 && (
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 text-amber-600" />

                <h3 className="text-sm font-bold">
                  Extraction Notices
                </h3>
              </div>

              <div className="mt-2 space-y-1">
                {extractionWarnings.map(
                  (warning, index) => (
                    <p
                      key={`${index}-${warning}`}
                      className="text-xs leading-5"
                    >
                      {warning}
                    </p>
                  )
                )}
              </div>
            </div>
          )}

          {/* SAVED NOTICE */}
          {savedCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3">
              <CheckCircle2 className="size-4 text-emerald-600" />

              <p className="text-xs font-semibold">
                {savedCount} question(s)
                already saved to this examination.
              </p>
            </div>
          )}

          {/* BULK CLASSIFICATION */}
          {unsavedQuestions.length > 0 && (
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="border-b bg-emerald-500/5 px-4 py-3">
                <h3 className="text-sm font-bold">
                  Organize Imported Questions
                </h3>

                <p className="mt-1 text-xs text-foreground/75">
                  Apply one section or optional
                  subtopic to all unsaved questions.
                </p>
              </div>

              <div
                className="grid gap-3 p-4 sm:grid-cols-2"
                onFocusCapture={() =>
                  void loadCatalogs()
                }
              >
                <SelectOrCreateDropdown
                  name="import_section"
                  label="Examination Section"
                  description="Applies to all unsaved questions."
                  placeholder="Select section"
                  createLabel="Create Section"
                  value={defaultSectionId}
                  options={sections}
                  availableOptions={
                    organizationSections
                  }
                  onChange={assignSection}
                  onUseAvailable={(id) =>
                    addExistingExamSectionAction(
                      examId,
                      id
                    )
                  }
                  onCreate={(name) =>
                    createExamSectionAction(
                      examId,
                      name
                    )
                  }
                  onCreated={(option) => {
                    setSections((current) =>
                      addOption(
                        current,
                        option
                      )
                    )

                    assignSection(
                      option.id
                    )
                  }}
                  disabled={busy || !editable}
                />

                <SelectOrCreateDropdown
                  name="import_topic"
                  label="Subtopic (optional)"
                  description="More specific grouping within the bank category."
                  placeholder="Select subtopic"
                  createLabel="Create Subtopic"
                  value={defaultTopicId}
                  options={topics}
                  availableOptions={
                    organizationTopics
                  }
                  onChange={assignTopic}
                  onUseAvailable={(id) =>
                    useOrganizationTopicAction(
                      id,
                      bankId,
                      categoryId
                    )
                  }
                  onCreate={(name) =>
                    createTopicAction(
                      bankId,
                      categoryId,
                      name
                    )
                  }
                  onCreated={(option) => {
                    setTopics((current) =>
                      addOption(
                        current,
                        option
                      )
                    )

                    assignTopic(
                      option.id
                    )
                  }}
                  disabled={
                    busy ||
                    !editable ||
                    !hasDefaults
                  }
                />
              </div>
            </div>
          )}

          {/* EXISTING QUESTION REVIEW/EDITING UI */}
          <ImportedQuestionList
            sections={sections}
            topics={topics}
            disabled={busy || !editable}
          />

          {/* SAVE BAR */}
          <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-background/95 p-3 backdrop-blur-md">
            <div className="min-w-0">
              <p className="text-sm font-bold">
                {readyToSave.length} ready to save
              </p>

              <p className="mt-1 text-xs font-medium text-foreground/75">
                {needsReview.length} need attention
                {" · "}
                {savedCount} saved
              </p>

              <p className="mt-1 text-[11px] text-foreground/65">
                Changes are temporarily stored
                in this browser.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() =>
                  setConfirmation("discard")
                }
                className="shadow-none"
              >
                <RotateCcw className="size-4" />
                Discard Draft
              </Button>

              {savedCount > 0 && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="shadow-none"
                >
                  <Link
                    href={urls.examDetails(slug)}
                  >
                    View Exam
                  </Link>
                </Button>
              )}

              {readyToSave.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  disabled={busy || !editable}
                  onClick={() =>
                    void saveReviewed()
                  }
                  className="shadow-none"
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}

                  {saving
                    ? "Saving..."
                    : `Save ${savingCount} Question${
                        savingCount === 1
                          ? ""
                          : "s"
                      }`}
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* EMPTY STATE */}
      {ready && questions.length === 0 && (
        <div className="rounded-xl border border-dashed border-primary/25 bg-primary/5 p-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <FileUp className="size-6 text-primary" />
          </div>

          <h3 className="mt-3 text-sm font-bold">
            Ready to Import
          </h3>

          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-foreground/75">
            Paste your questions or upload
            a Word document. Extracted questions
            will appear here for review before
            anything is saved to the examination.
          </p>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      <AlertDialog
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setConfirmation(null)
          }
        }}
      >
        <AlertDialogContent className="shadow-none">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmation === "replace"
                ? "Replace unsaved questions?"
                : "Discard local import draft?"}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {confirmation === "replace"
                ? `This will replace ${unsavedQuestions.length} unsaved question(s) in your review. Questions already saved to the examination will remain untouched.`
                : `This will clear the local import review. Any questions already saved to the examination will remain in the database.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={busy}
              className="shadow-none"
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={busy}
              onClick={(event) => {
                event.preventDefault()
                confirmAction()
              }}
              className="shadow-none"
            >
              {confirmation === "replace"
                ? "Replace Questions"
                : "Discard Draft"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
