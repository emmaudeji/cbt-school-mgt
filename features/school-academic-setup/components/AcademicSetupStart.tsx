
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  ShieldCheck,
  Upload,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import { urls } from "@/constants"

import type {
  AcademicTemplatePreview,
} from "../services/academic-template"

import {
  applyAcademicTemplate,
  previewAcademicTemplate,
} from "../services/template-actions"

import { AcademicReviewStep } from "./AcademicReviewStep"

type Props = {
  schoolName: string
  sessionId: string
  termId: string
  sessionName: string
  termName: string
}

export function AcademicSetupStart({
  schoolName,
  sessionId,
  termId,
  sessionName,
  termName,
}: Props) {
  const router = useRouter()

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] =
    useState<AcademicTemplatePreview | null>(null)

  const [busy, setBusy] = useState<
    "preview" | "saving" | null
  >(null)

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const params = new URLSearchParams({
    session: sessionId,
    term: termId,
  })

  const templateUrl =
    `${urls.schoolAcademicSetup}/template?${params}`

  function stepUrl(step: number) {
    return (
      `${urls.schoolAcademicSetup}?` +
      new URLSearchParams({
        session: sessionId,
        term: termId,
        step: String(step),
      })
    )
  }

  function buildFormData() {
    const formData = new FormData()

    if (file) formData.append("file", file)

    formData.append("sessionId", sessionId)
    formData.append("termId", termId)

    return formData
  }

  async function handlePreview() {
    if (!file) return

    setBusy("preview")
    setError("")
    setMessage("")
    setPreview(null)

    try {
      const result = await previewAcademicTemplate(
        buildFormData()
      )

      setPreview(result)

      if (result.ok) {
        setMessage(
          "Template checked. Review the expected academic setup below."
        )
      }
    } catch (err) {
      console.error("[ACADEMIC:PREVIEW]", err)
      setError("Unable to process the CSV file.")
    } finally {
      setBusy(null)
    }
  }

  async function handleSave() {
    if (!file || !preview?.ok || busy) return

    setBusy("saving")
    setError("")
    setMessage("")

    try {
      const result = await applyAcademicTemplate(
        buildFormData(),
        preview.digest
      )

      if (!result.ok) {
        setError(result.message)
        return
      }

      router.push(stepUrl(4))
      router.refresh()
    } catch (err) {
      console.error("[ACADEMIC:IMPORT]", err)
      setError(
        "Unable to save academic setup. Please try again."
      )
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Page heading */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Prepare Your Academic Year
          </h1>

          <p className="text-sm text-muted-foreground">
            {schoolName}
            {" · "}
            {sessionName}
            {" · "}
            {termName}
          </p>
        </div>

        <Badge className="bg-primary/10 text-primary shadow-none hover:bg-primary/10">
          Getting Started
        </Badge>
      </div>

      {/* Progress */}
      <div className="grid grid-cols-5 gap-2">
        {[
          "Start",
          "Year",
          "Subjects",
          "Assessments",
          "Review",
        ].map((label, index) => (
          <div key={label} className="space-y-2">
            <div
              className={
                index === 0
                  ? "h-1.5 rounded-full bg-primary"
                  : "h-1.5 rounded-full bg-muted"
              }
            />
            <p
              className={
                index === 0
                  ? "text-xs font-semibold text-primary"
                  : "text-xs text-muted-foreground"
              }
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Introduction */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileSpreadsheet className="size-5" />
          </div>

          <div className="space-y-1">
            <h2 className="font-semibold">
              Your academic setup, made simple
            </h2>

            <p className="text-sm leading-6 text-muted-foreground">
              Use your school's existing records to
              prepare classes, subjects and assessments
              for the selected term. You can do this
              with a spreadsheet or continue through
              the guided setup.
            </p>
          </div>
        </div>
      </div>

      <Card className="gap-0 overflow-hidden p-0 shadow-none">
        <CardContent className="p-4 sm:p-5">
          <Tabs defaultValue="instructions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="instructions">
                How it works
              </TabsTrigger>

              <TabsTrigger value="upload">
                Upload academic data
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="instructions"
              className="space-y-5 pt-5"
            >
              <div className="space-y-1">
                <h3 className="text-base font-semibold">
                  Prepare your school information
                </h3>

                <p className="text-sm text-muted-foreground">
                  Four simple steps to get ready for
                  your school's examinations.
                </p>
              </div>

              {[
                {
                  title: "Download your template",
                  description:
                    "The spreadsheet includes your current class, subject and assessment records.",
                },
                {
                  title: "Make your changes",
                  description:
                    "Add subjects and assessments using familiar names. Keep the column headings unchanged.",
                },
                {
                  title: "Upload and review",
                  description:
                    "The system identifies new records, existing records and information needing correction.",
                },
                {
                  title: "Confirm and continue",
                  description:
                    "Save approved additions and open the academic setup review.",
                },
              ].map((item, index) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      {item.title}
                    </p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}

              <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 size-4 shrink-0 text-sky-600" />

                  <p className="text-xs leading-6">
                    Use existing class and subject names
                    from your school catalogue. To add
                    a missing class, subject or academic
                    period, use School Configuration
                    or the guided setup first.
                  </p>
                </div>
              </div>

              <Button asChild className="shadow-none">
                <a href={templateUrl}>
                  <Download className="size-4" />
                  Download Academic Template
                </a>
              </Button>
            </TabsContent>

            <TabsContent
              value="upload"
              className="space-y-4 pt-5"
            >
              <div className="space-y-1">
                <h3 className="text-base font-semibold">
                  Upload your completed template
                </h3>

                <p className="text-sm text-muted-foreground">
                  Select your edited CSV file. Nothing
                  will be saved until you review and confirm.
                </p>
              </div>

              <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-primary/25 bg-primary/5 px-5 py-8 text-center hover:bg-primary/10">
                <Upload className="size-8 text-primary" />

                <span className="text-sm font-semibold">
                  {file
                    ? file.name
                    : "Choose your academic CSV file"}
                </span>

                <span className="text-xs text-muted-foreground">
                  CSV format · Maximum 2 MB
                </span>

                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={(event) => {
                    setFile(
                      event.target.files?.[0] ?? null
                    )
                    setPreview(null)
                    setMessage("")
                    setError("")
                  }}
                />
              </label>

              <Button
                type="button"
                onClick={handlePreview}
                disabled={!file || busy !== null}
                className="shadow-none"
              >
                {busy === "preview" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="size-4" />
                )}

                {busy === "preview"
                  ? "Checking template..."
                  : "Preview Academic Data"}
              </Button>

              <p className="text-xs text-muted-foreground">
                Need a fresh copy?{" "}
                <a
                  href={templateUrl}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Download the latest template
                </a>
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-400"
        >
          <CheckCircle2 className="size-4 shrink-0" />
          {message}
        </div>
      )}

      {/* Import preview */}
      {preview && (
        <div className="space-y-4">
          <Card className="gap-3 p-4 shadow-none sm:p-5">
            <CardHeader className="p-0">
              <CardTitle className="text-lg">
                Your Upload Review
              </CardTitle>

              <p className="text-sm text-muted-foreground">
                Here is what the school will look
                like if this file is applied.
              </p>
            </CardHeader>

            <CardContent className="space-y-4 p-0">
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: "New subjects",
                    value: preview.additions.offerings,
                    style:
                      "border-primary/20 bg-primary/5",
                  },
                  {
                    label: "New assessments",
                    value: preview.additions.components,
                    style:
                      "border-sky-500/20 bg-sky-500/5",
                  },
                  {
                    label: "Already saved",
                    value: preview.additions.unchanged,
                    style:
                      "border-emerald-500/20 bg-emerald-500/5",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-lg border p-3 ${item.style}`}
                  >
                    <p className="text-xl font-semibold tabular-nums">
                      {item.value}
                    </p>
                    <p className="text-xs">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

              {preview.errors.length > 0 && (
                <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                    <AlertCircle className="size-4" />
                    Please correct these items
                  </p>

                  <ul className="list-disc space-y-1 pl-5 text-xs leading-5">
                    {preview.errors.slice(0, 25).map(
                      (item, index) => (
                        <li key={index}>{item}</li>
                      )
                    )}
                  </ul>

                  {preview.errors.length > 25 && (
                    <p className="text-xs">
                      Plus {preview.errors.length - 25}
                      {" "}additional errors.
                    </p>
                  )}

                  <p className="text-xs">
                    Edit your CSV and upload it again.
                    No changes have been saved.
                  </p>
                </div>
              )}

              {preview.ok && (
                <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />

                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      File validation passed
                    </p>

                    <p className="text-xs leading-5">
                      Existing records will be preserved.
                      Review the academic readiness below
                      before confirming.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {preview.projected && (
            <div className="space-y-3">
              <Badge variant="secondary">
                Preview · Not yet saved
              </Badge>

              <AcademicReviewStep
                data={preview.projected}
                sessionId={sessionId}
                termId={termId}
                sessionName={sessionName}
                termName={termName}
              />
            </div>
          )}

          {preview.ok && (
            <Card className="gap-3 border-primary/20 bg-primary/5 p-4 shadow-none sm:p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                <h3 className="font-semibold">
                  Confirm Academic Setup
                </h3>
              </div>

              <p className="text-sm leading-6">
                Check the readiness report above.
                If anything is missing, edit the
                template and upload it again.
                You may also complete missing items
                through the guided setup afterwards.
              </p>

              <Button
                onClick={handleSave}
                disabled={busy !== null}
                className="w-full shadow-none sm:w-auto"
              >
                {busy === "saving" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}

                {busy === "saving"
                  ? "Saving academic setup..."
                  : "Save and Continue to Review"}

                {busy !== "saving" && (
                  <ArrowRight className="size-4" />
                )}
              </Button>
            </Card>
          )}
        </div>
      )}

      <div className="flex justify-between gap-3 border-t pt-4">
        <div>
          <p className="text-sm font-medium">
            Prefer setting up manually?
          </p>
          <p className="text-xs text-muted-foreground">
            Use the guided four-step process.
          </p>
        </div>

        <Button
          variant="outline"
          asChild
          className="shadow-none"
        >
          <Link href={stepUrl(1)}>
            Guided Setup
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
