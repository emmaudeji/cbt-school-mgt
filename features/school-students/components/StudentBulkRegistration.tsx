
"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  UploadCloud,
} from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { urls, RECENT_REGISTRATION_KEY } from "@/constants"
import { LinkButton } from "@/components/shared/LinkButton"

type Issue = {
  row: number
  field: string
  message: string
}

type Preview = {
  count: number
  valid: boolean
  issues: Issue[]
  preview: {
    first_name: string
    last_name: string
    admission_number: string
    guardian_name: string
  }[]
}

type ImportResult = {
  count: number
  students: {
    id: string
    first_name?: string
    last_name?: string
  }[]
}

type ApiError = {
  error?: string
  issues?: Issue[]
}

const ENDPOINT = "/api/students/registration"
const MAX_BYTES = 2 * 1024 * 1024
const SUPPORTED_FORMATS = ["csv", "xlsx", "json"]

async function readResponse(
  response: Response
): Promise<unknown> {
  const contentType =
    response.headers.get("content-type") ?? ""

  if (
    response.redirected ||
    !contentType.includes("application/json")
  ) {
    throw new Error(
      "The registration endpoint did not return JSON. Check the API route."
    )
  }

  return response.json()
}

export default function StudentBulkRegistration() {
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Preview | null>(
    null
  )
  const [result, setResult] = useState<ImportResult | null>(
    null
  )
  const [loading, setLoading] = useState<
    "preview" | "import" | null
  >(null)

  function chooseFile(nextFile: File | null) {
    setPreview(null)
    setResult(null)
    setFile(null)

    if (!nextFile) return

    const extension = nextFile.name
      .split(".")
      .pop()
      ?.toLowerCase()

    if (
      !extension ||
      !SUPPORTED_FORMATS.includes(extension)
    ) {
      toast.error(
        "Choose a CSV, XLSX or JSON registration file."
      )
      return
    }

    if (
      nextFile.size === 0 ||
      nextFile.size > MAX_BYTES
    ) {
      toast.error(
        "File size must be greater than zero and not exceed 2 MB."
      )
      return
    }

    setFile(nextFile)
  }

  async function submit(mode: "preview" | "import") {
    if (!file || loading) return

    if (mode === "import" && !preview?.valid) {
      toast.error(
        "Preview and validate the file before importing."
      )
      return
    }

    setLoading(mode)

    const body = new FormData()
    body.set("file", file)
    body.set("mode", mode)

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        body,
        cache: "no-store",
        credentials: "same-origin",
      })

      const payload = await readResponse(response)

      if (!response.ok) {
        const errorPayload = payload as ApiError

        if (
          mode === "import" &&
          errorPayload.issues?.length
        ) {
          setPreview((current) =>
            current
              ? {
                  ...current,
                  valid: false,
                  issues: errorPayload.issues ?? [],
                }
              : null
          )
        }

        throw new Error(
          errorPayload.error ??
            "Unable to process registration file."
        )
      }

      if (mode === "preview") {
        const validated = payload as Preview

        setPreview(validated)
        setResult(null)

        if (!validated.valid) {
          toast.error(
            `${validated.issues.length} validation issue(s) found.`
          )
        }

        return
      }

      // Only a successful IMPORT response contains
      // the newly registered student IDs.
      const completed = payload as ImportResult

      if (
        !Array.isArray(completed.students) ||
        !Number.isInteger(completed.count) ||
        completed.students.length !== completed.count
      ) {
        throw new Error(
          "Registration response is incomplete. Refresh the student directory before retrying."
        )
      }

      // Keep the batch available for the next stage.
      // This is navigation state, not authorization.
      try {
        sessionStorage.setItem(
          RECENT_REGISTRATION_KEY,
          JSON.stringify({
            ids: completed.students.map(
              (student) => student.id
            ),
            createdAt: Date.now(),
          })
        )
      } catch (storageError) {
        console.warn(
          "[REGISTRATION BATCH STORAGE]",
          storageError
        )

        toast.info(
          "Registration succeeded, but the batch could not be saved for automatic enrollment selection."
        )
      }

      setResult(completed)
      setPreview(null)
      setFile(null)

      if (inputRef.current) {
        inputRef.current.value = ""
      }

      toast.success(
        `${completed.count} student(s) registered successfully.`
      )
    } catch (error) {
      console.error("[BULK REGISTRATION]", error)

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to process registration file."
      )
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Upload */}
      <Card className="gap-0 overflow-hidden border-t-4 border-t-primary py-0">
        <CardHeader className="border-b p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <UploadCloud className="size-5 text-primary" />

            <CardTitle className="text-base">
              Bulk Student Registration
            </CardTitle>
          </div>

          <p className="text-sm text-muted-foreground">
            Upload up to 300 students with optional
            personal and guardian details.
          </p>
        </CardHeader>

        <CardContent className="space-y-5 p-4 sm:p-6">
          <div className="rounded-xl border border-dashed border-primary/30 bg-primary/[0.03] p-5 text-center sm:p-8">
            <FileSpreadsheet className="mx-auto mb-3 size-10 text-primary" />

            <p className="text-sm font-semibold">
              Select your student registration file
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              CSV, Excel (.xlsx) or JSON · Maximum 2 MB
            </p>

            <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
              <UploadCloud className="size-4" />
              Choose File

              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.json"
                className="sr-only"
                disabled={loading !== null}
                onChange={(event) => {
                  chooseFile(
                    event.target.files?.[0] ?? null
                  )

                  // Allow selecting the same file again.
                  event.target.value = ""
                }}
              />
            </label>

            {file && (
              <p className="mt-3 break-all text-xs text-muted-foreground">
                {file.name} ·{" "}
                {(file.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Keep your working GET endpoint */}
            <a
              href={ENDPOINT}
              download="student-registration-template.csv"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <Download className="size-4" />
              Download CSV Template
            </a>

            <Button
              type="button"
              disabled={!file || loading !== null}
              onClick={() => void submit("preview")}
            >
              {loading === "preview" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="size-4" />
              )}

              Preview & Validate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {preview && (
        <Card className="gap-0 overflow-hidden border-t-4 border-t-primary py-0">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b p-4 sm:p-5">
            <div>
              <CardTitle className="text-base">
                Import Preview
              </CardTitle>

              <p className="mt-1 text-xs text-muted-foreground">
                {preview.count} student records found
              </p>
            </div>

            <Badge
              variant={
                preview.valid
                  ? "default"
                  : "destructive"
              }
            >
              {preview.valid
                ? "Ready to Import"
                : `${preview.issues.length} issue(s)`}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-4 p-4 sm:p-5">
            {preview.issues.length > 0 ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                  <AlertCircle className="size-4" />
                  Correct these records
                </div>

                <ul className="mt-3 max-h-52 space-y-2 overflow-y-auto">
                  {preview.issues.map(
                    (issue, index) => (
                      <li
                        key={`${issue.row}-${issue.field}-${index}`}
                        className="text-xs"
                      >
                        Row {issue.row}: {issue.message}
                      </li>
                    )
                  )}
                </ul>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm">
                <CheckCircle2 className="size-5 text-primary" />
                All records passed initial validation.
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[440px] text-left text-xs">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3">
                      Admission Number
                    </th>
                    <th className="p-3">Guardian</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {preview.preview.map(
                    (student, index) => (
                      <tr key={index}>
                        <td className="p-3 font-medium">
                          {student.first_name}{" "}
                          {student.last_name}
                        </td>

                        <td className="p-3">
                          {student.admission_number ||
                            "—"}
                        </td>

                        <td className="p-3">
                          {student.guardian_name || "—"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {preview.count >
              preview.preview.length && (
              <p className="text-xs text-muted-foreground">
                Showing the first{" "}
                {preview.preview.length} records
                for review.
              </p>
            )}

            <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Nothing is saved until you confirm.
              </p>

              <Button
                type="button"
                disabled={
                  !preview.valid ||
                  loading !== null
                }
                onClick={() =>
                  void submit("import")
                }
              >
                {loading === "import" && (
                  <Loader2 className="size-4 animate-spin" />
                )}

                Confirm Registration (
                {preview.count})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Successful registration */}
      {result && (
        <Card className="gap-0 overflow-hidden border-t-4 border-t-primary py-0">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-9 shrink-0 text-primary" />

              <div>
                <p className="font-semibold">
                  Registration Completed
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {result.count} student(s) registered
                  successfully.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {result.students.length === 1 ? (
                <LinkButton
                  href={urls.studentDetails(
                    result.students[0].id
                  )}
                >
                  View Student Profile
                </LinkButton>
              ) : (
                <LinkButton
                  href={`${urls.enrollments}?batch=recent`}
                >
                  Continue to Bulk Enrollment
                  <ArrowRight className="size-4" />
                </LinkButton>
              )}

              <Button
                variant="outline"
                asChild
              >
                <Link href={urls.students}>
                  Open Student Directory
                </Link>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setResult(null)
                  setPreview(null)
                  setFile(null)
                }}
              >
                Register More Students
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Registration creates permanent student
              records. Class placement is managed
              separately through enrollment.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
