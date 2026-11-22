
"use client"

import Link from "next/link"
import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardPaste,
  FileText,
  Loader2,
  RotateCcw,
  Upload,
} from "lucide-react"
import { toast } from "react-toastify"

import { urls } from "@/constants"
import { useOrgStore } from "@/store/org-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog"
import { LinkButton } from "@/components/shared/LinkButton"
import SelectOrCreateDropdown from "@/components/shared/SelectOrCreateDropdown"

import type { ImportOption } from "@/types/question-import"

import { useQuestionImport } from "../context/QuestionImportProvider"
import { getImportIssues } from "../services/import-validation"
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

import { ImportedQuestionList } from "./ImportedQuestionList"
import { getImportCatalogOptionsAction } from "../services/action.importCatalog"
import { RichTextEditor } from "@/components/shared/RichTextEditor"
import { richTextToQuestionText } from "../services/rich-text-to-questions"

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

type Source = "document" | "paste"

type CatalogOption = {
  id: string
  name: string
}

function addOption(
  current: ImportOption[],
  option: ImportOption
): ImportOption[] {
  if (current.some(item => item.id === option.id)) {
    return current
  }

  return [...current, option].sort((a, b) =>
    a.name.localeCompare(b.name)
  )
}

const sample = `1. What is 12 × 5?
A. 50
B. 55
C. 60
D. 65
Answer: C

2. What is the capital of Nigeria?
A. Lagos
B. Abuja
C. Kano
D. Ibadan
Answer: B`

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
  const fileInput = useRef<HTMLInputElement>(null)

  const isSchool = useOrgStore(
    state => state.organization.type === "school"
  )

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

  const [file, setFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState("")
  const [error, setError] = useState("")
  const [extractionWarnings, setExtractionWarnings] =
    useState<string[]>([])

  const [extracting, startExtraction] = useTransition()
  const [saving, setSaving] = useState(false)

  const [confirmation, setConfirmation] =
    useState<"replace" | "discard" | null>(null)

  const [sections, setSections] = useState<ImportOption[]>(
    initialSections.map(section => ({
      id: section.id,
      name: section.title,
    }))
  )

  const [topics, setTopics] =
    useState<ImportOption[]>(initialTopics)

  const [defaultSectionId, setDefaultSectionId] =
    useState(initialSectionId)

  const [defaultTopicId, setDefaultTopicId] =
    useState("")

  const [organizationSections, setOrganizationSections] =
    useState<CatalogOption[]>([])

  const [organizationTopics, setOrganizationTopics] =
    useState<CatalogOption[]>([])

  const [catalogLoaded, setCatalogLoaded] =
    useState(false)

  const unsavedQuestions = questions.filter(
    question => !question.saved
  )

  const readyToSave = unsavedQuestions.filter(
    question => getImportIssues(question).length === 0
  )

  const needsReview = unsavedQuestions.filter(
    question => getImportIssues(question).length > 0
  )

  const savedCount =
    questions.length - unsavedQuestions.length

  const busy = extracting || saving

  // Load reusable catalogs when needed.
  // Uses a server action rather than directly
  // exposing organization-wide database access.
  const loadCatalogs = async () => {
    if (catalogLoaded) return

    try {


      const result = await getImportCatalogOptionsAction()

      if (result.success) {
        setOrganizationSections(result.sections)
        setOrganizationTopics(result.topics)
        setCatalogLoaded(true)
      } else {
        toast.error(
          result.error ?? "Unable to load reusable options."
        )
      }
    } catch (error) {
      console.error("[CBT:IMPORT_CATALOGS]", error)
      toast.error("Unable to load reusable options.")
    }
  }

  const clearFile = () => {
    setFile(null)
    setError("")

    if (fileInput.current) {
      fileInput.current.value = ""
    }
  }

  const createPastedDocument = async (
    text: string
  ): Promise<File> => {
    const { Document, Packer, Paragraph } =
      await import("docx")

    const lines = text
      .replace(/\r\n?/g, "\n")
      .split("\n")

    const document = new Document({
      sections: [
        {
          properties: {},
          children: lines.map(
            line => new Paragraph({
              text: line || " ",
            })
          ),
        },
      ],
    })

    const blob = await Packer.toBlob(document)

    return new File(
      [blob],
      "pasted-questions.docx",
      {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }
    )
  }


const performExtract = () => {
  if (busy || !editable || !ready) return

  setError("")

  startExtraction(async () => {
    try {
      let documentFile: File

      if (source === "document") {
        if (!file) {
          setError("Choose a Word document.")
          return
        }

        if (!file.name.toLowerCase().endsWith(".docx")) {
          setError("Only .docx files are supported.")
          return
        }

        documentFile = file
      } else {
        // ReactQuill returns HTML.
        // Convert it before creating the Word document.
        const plainText = richTextToQuestionText(pastedText)

        if (plainText.length < 20) {
          setError(
            "Paste complete questions, answer choices and correct answers."
          )
          return
        }

        if (plainText.length > 100_000) {
          setError(
            "Please import smaller batches of questions."
          )
          return
        }

        // Debug the actual content being submitted.
        console.debug(
          "[CBT:PASTED_QUESTION_TEXT]",
          plainText.slice(0, 1500)
        )

        documentFile =
          await createPastedDocument(plainText)
      }

      if (
        documentFile.size === 0 ||
        documentFile.size > 5 * 1024 * 1024
      ) {
        setError("Document must not exceed 5 MB.")
        return
      }

      const formData = new FormData()
      formData.set("file", documentFile)

      const response = await extractQuestionsAction(
        slug,
        formData
      )

      if (!response.success) {
        const message =
          response.error ??
          "Unable to extract questions."

        setError(message)
        toast.error(message)
        return
      }

      if (response.questions.length === 0) {
        setError(
          "No questions were recognized. Use numbered questions with A–D options and an Answer line."
        )
        return
      }

      setExtracted(response.questions, {
        sectionId: defaultSectionId,
        topicId: defaultTopicId,
      })

      setExtractionWarnings(
        response.warnings ?? []
      )

      toast.success(
        `${response.questions.length} questions extracted. Review them below.`
      )
    } catch (cause) {
      console.error(
        "[CBT:EXTRACT_QUESTIONS]",
        cause
      )

      setError(
        "Unable to process the questions. Please try again."
      )
      toast.error("Question extraction failed.")
    }
  })
}


  const extract = () => {
    if (!ready || busy || !editable) return

    if (source === "document" && !file) {
      setError("Choose a Word document.")
      return
    }

    if (
      source === "paste" &&
      !pastedText.trim()
    ) {
      setError("Paste your questions first.")
      return
    }

    if (unsavedQuestions.length > 0) {
      setConfirmation("replace")
      return
    }

    performExtract()
  }

  const assignSection = (id: string) => {
    setDefaultSectionId(id)
    assignAll("sectionId", id)
  }

  const assignTopic = (id: string) => {
    setDefaultTopicId(id)
    assignAll("topicId", id)
  }

  const saveReviewed = async () => {
    if (!readyToSave.length || busy || !editable) {
      return
    }

    setSaving(true)

    try {
      const response =
        await saveImportedQuestionsAction(
          examId,
          slug,
          readyToSave.map(question => ({
            id: question.id,
            sectionId: question.sectionId,
            topicId: question.topicId,
            prompt: question.prompt,
            options: question.options,
            correctOption: question.correctOption,
            explanation: question.explanation,
            difficulty: question.difficulty,
            points: question.points,
          }))
        )

      if (response.savedIds.length > 0) {
        markSaved(response.savedIds)

        toast.success(
          `${response.savedIds.length} questions saved.`
        )

        // Keep the review open for partial saves.
        // Navigate only when all unsaved questions
        // were successfully saved.
        if (
          response.savedIds.length ===
            unsavedQuestions.length &&
          !response.error
        ) {
          router.push(urls.examQuestions(slug))
        }
      }

      if (response.error) {
        toast.error(response.error)
      }
    } catch (cause) {
      console.error(
        "[CBT:SAVE_IMPORTED_QUESTIONS]",
        cause
      )

      toast.error(
        "The save result could not be confirmed. Check the examination before retrying."
      )
    } finally {
      setSaving(false)
    }
  }

  const confirmAction = () => {
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
      toast.info("Import draft discarded.")
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 pb-24">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Link
            href={urls.examQuestions(slug)}
            className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            Exam Questions
          </Link>

          <h1 className="text-xl font-bold text-foreground">
            Import Questions
          </h1>

          <p className="text-sm text-foreground/75">
            Paste or upload questions for {title},
            then review before saving.
          </p>
        </div>

        <Badge
          variant="outline"
          className="border-primary/25"
        >
          {bankName} · {categoryName}
        </Badge>
      </header>

      <Card className="gap-0 overflow-hidden border-primary/20 p-0 shadow-none">
        <CardHeader className="border-b bg-primary/5 px-4 py-3">
          <CardTitle className="text-sm font-bold">
            Add Questions
          </CardTitle>

          <CardDescription className="text-xs">
            Choose how to bring questions into the examination.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-0 gap-4 px-4 py-4">
          {/* Single source switch */}
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-1">
            <Button
              type="button"
              size="sm"
              variant={
                source === "paste"
                  ? "default"
                  : "ghost"
              }
              disabled={busy}
              onClick={() => {
                setSource("paste")
                setError("")
              }}
              className="shadow-none"
            >
              <ClipboardPaste className="size-4" />
              Paste or Type Text
            </Button>

            <Button
              type="button"
              size="sm"
              variant={
                source === "document"
                  ? "default"
                  : "ghost"
              }
              disabled={busy}
              onClick={() => {
                setSource("document")
                setError("")
              }}
              className="shadow-none"
            >
              <Upload className="size-4" />
              Upload Word
            </Button>
          </div>

          {source === "paste" ? (
            <div className="space-y-2">
 
              <RichTextEditor
                variant="exam"
                label="Paste Questions"
                value={pastedText}
                onChange={setPastedText}
                placeholder="Paste or type your questions here..."
                minHeight={240}
                disabled={!editable || busy}
              />

              {/* <Textarea
                id="bulk-question-text"
                value={pastedText}
                onChange={event =>
                  setPastedText(event.target.value)
                }
                placeholder={sample}
                rows={12}
                maxLength={100000}
                disabled={!editable || busy}
                className="min-h-64 resize-y border-primary/20 bg-background font-mono text-sm leading-6 shadow-none"
              /> */}

              <div className="flex items-center justify-between gap-2 text-xs text-foreground/65">
                <span>
                  Paste numbered questions, options and answers.
                </span>
                <span className="tabular-nums">
                  {pastedText.length.toLocaleString()} characters
                </span>
              </div>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-primary/25 bg-primary/5 px-5 py-8 text-center hover:bg-primary/10">
              <div className="rounded-lg bg-background p-3 text-primary">
                <Upload className="size-5" />
              </div>

              <span className="text-sm font-semibold text-foreground">
                {file?.name ?? "Choose a Word document"}
              </span>

              <span className="text-xs text-foreground/70">
                .docx · Maximum 5 MB
              </span>

              <input
                ref={fileInput}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                disabled={!editable || busy}
                onChange={event => {
                  setFile(
                    event.target.files?.[0] ?? null
                  )
                  setError("")
                }}
              />
            </label>
          )}

          <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
            <p className="text-xs font-semibold text-sky-800 dark:text-sky-300">
              Recommended question format
            </p>

            <pre className="mt-2 whitespace-pre-wrap text-xs leading-5 text-foreground/80">
              {sample}
            </pre>

            <p className="mt-2 text-xs text-foreground/65">
              Other formats supported by your Word importer
              can also be pasted here. Review the extracted
              questions before saving.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          {!editable && (
            <div className="rounded-lg border border-destructive/25 p-3 text-sm text-destructive">
              This examination is not available for editing.
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            {source === "document" && file && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={clearFile}
                className="shadow-none"
              >
                Clear File
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              onClick={extract}
              disabled={
                busy ||
                !ready ||
                !editable ||
                (source === "document"
                  ? !file
                  : !pastedText.trim())
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
        </CardContent>
      </Card>

      {!ready && (
        <p className="flex items-center justify-center gap-2 py-8 text-sm text-foreground/70">
          <Loader2 className="size-4 animate-spin" />
          Restoring import draft...
        </p>
      )}

      {ready && questions.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-foreground">
                Review Questions
              </h2>

              <p className="mt-1 text-xs text-foreground/70">
                Check answers, edit questions and assign
                their sections before saving.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {questions.length} imported
              </Badge>

              <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300">
                {readyToSave.length} ready
              </Badge>

              {needsReview.length > 0 && (
                <Badge className="bg-amber-500/10 text-amber-800 hover:bg-amber-500/10 dark:text-amber-300">
                  {needsReview.length} need review
                </Badge>
              )}
            </div>
          </div>

          {extractionWarnings.length > 0 && (
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />

                <div>
                  <p className="text-sm font-semibold">
                    Extraction notices
                  </p>

                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
                    {extractionWarnings.map(
                      (warning, index) => (
                        <li key={index}>{warning}</li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {savedCount > 0 && (
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3 text-sm">
              <CheckCircle2 className="mr-2 inline size-4 text-emerald-600" />
              {savedCount} questions already saved.
            </div>
          )}

          {unsavedQuestions.length > 0 && (
            <Card className="gap-0 border-primary/20 py-0 shadow-none">
              <CardHeader className="border-b bg-primary/5 py-3">
                <CardTitle className="text-sm font-bold">
                  Organize Questions
                </CardTitle>

                <CardDescription className="text-xs">
                  Assign a section or topic to all unsaved
                  questions. Individual questions can still
                  be changed in the editor.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-4 py-4 sm:grid-cols-2">
                <div onFocusCapture={() => void loadCatalogs()}>
                  <SelectOrCreateDropdown
                    name="import_section"
                    label="Examination Section"
                    description="Applies to all unsaved questions."
                    placeholder="Choose section"
                    createLabel="Create New Section"
                    value={defaultSectionId}
                    options={sections}
                    availableOptions={organizationSections.map(
                      item => ({
                        id: item.id,
                        name: item.name,
                      })
                    )}
                    onChange={assignSection}
                    onUseAvailable={id =>
                      addExistingExamSectionAction(
                        examId,
                        id
                      )
                    }
                    onCreate={name =>
                      createExamSectionAction(
                        examId,
                        name
                      )
                    }
                    onCreated={option => {
                      setSections(current =>
                        addOption(current, option)
                      )
                      assignSection(option.id)
                    }}
                    disabled={busy || !editable}
                  />
                </div>

                <div onFocusCapture={() => void loadCatalogs()}>
                  <SelectOrCreateDropdown
                    name="import_topic"
                    label="Question Topic"
                    description="Optional. Applies to all unsaved questions."
                    placeholder="Choose topic"
                    createLabel="Create New Topic"
                    value={defaultTopicId}
                    options={topics}
                    availableOptions={organizationTopics}
                    onChange={assignTopic}
                    onUseAvailable={id =>
                      useOrganizationTopicAction(
                        id,
                        bankId,
                        categoryId
                      )
                    }
                    onCreate={name =>
                      createTopicAction(
                        bankId,
                        categoryId,
                        name
                      )
                    }
                    onCreated={option => {
                      setTopics(current =>
                        addOption(current, option)
                      )
                      assignTopic(option.id)
                    }}
                    disabled={
                      busy ||
                      !editable ||
                      !bankId ||
                      !categoryId
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <ImportedQuestionList
            sections={sections}
            topics={topics}
            disabled={busy || !editable}
          />

          <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-background/95 p-3 backdrop-blur-md">
            <div>
              <p className="text-sm font-bold">
                {readyToSave.length} ready to save
              </p>

              <p className="mt-1 text-xs text-foreground/70">
                {needsReview.length} need attention ·{" "}
                {savedCount} already saved
              </p>

              <p className="mt-1 text-xs text-foreground/65">
                Review changes are saved in this browser.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {savedCount > 0 && (
                <LinkButton
                  href={urls.examQuestions(slug)}
                  size="sm"
                >
                  View Exam
                </LinkButton>
              )}

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  setConfirmation("discard")
                }
                className="shadow-none"
              >
                <RotateCcw className="size-4" />
                Discard Draft
              </Button>

              {readyToSave.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  disabled={busy || !editable}
                  onClick={saveReviewed}
                  className="shadow-none"
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}

                  {saving
                    ? "Saving..."
                    : `Save ${readyToSave.length} Questions`}
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      <ConfirmActionDialog
        open={confirmation !== null}
        onOpenChange={open => {
          if (!open && !busy) {
            setConfirmation(null)
          }
        }}
        title={
          confirmation === "replace"
            ? "Replace unsaved questions?"
            : "Discard import draft?"
        }
        description={
          confirmation === "replace"
            ? `This will replace ${unsavedQuestions.length} unsaved questions in your review. Questions already saved to the examination are not deleted.`
            : `This will discard ${unsavedQuestions.length} unsaved questions from this browser. Questions already saved to the examination remain available.`
        }
        confirmLabel={
          confirmation === "replace"
            ? "Replace Questions"
            : "Discard Draft"
        }
        destructive={confirmation === "discard"}
        pending={busy}
        onConfirm={confirmAction}
      />
    </div>
  )
}
