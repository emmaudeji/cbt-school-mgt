
"use client"

import { useEffect, useState, type ReactNode } from "react"
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  ExternalLink,
  KeyRound,
  Link2,
  ShieldCheck,
  UsersRound,
} from "lucide-react"
import { toast } from "react-toastify"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { AccessMode } from "@/types"
import { DownloadExamCredentialsButton } from "../DownloadExamCredentialsButton"

type Props = {
  examSlug: string
  publicationId: string | null
  accessMode: AccessMode
  assignedCount: number
  credentialsReadyCount?: number
  credentialsMissingCount?: number
  entryCode?: string | null
  downloadHref?: string | null
  accessActions?: ReactNode
  className?: string
}

const modeLabels = {
  registered: "Registered accounts",
  access_code: "Personal access codes",
  open_link: "Public link",
} as const

function CopyValue({
  label,
  value,
}: {
  label: string
  value: string
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setCopied(false)
  }, [value])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(`${label} copied`)
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`)
    }
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg border bg-background px-3 py-3">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-xs font-medium ">
          {label}
        </p>

        <p className="break-all text-sm font-semibold">
          {value}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 shadow-none"
        onClick={() => void copy()}
      >
        {copied ? (
          <Check className="size-4" />
        ) : (
          <Copy className="size-4" />
        )}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  )
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string
  value: number | string
  icon: ReactNode
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-center gap-2 text-xs ">
        {icon}
        <span>{label}</span>
      </div>

      <p className="mt-2 text-xl font-semibold tabular-nums">
        {typeof value === "number"
          ? value.toLocaleString()
          : value}
      </p>
    </div>
  )
}

export function ExamCredentialSummary({
  examSlug,
  publicationId,
  accessMode,
  assignedCount,
  credentialsReadyCount,
  credentialsMissingCount,
  entryCode,
  downloadHref,
  accessActions,
  className,
}: Props) {
  const hasPublication = Boolean(publicationId)

  // The /take/[code] route expects the publication entry code,
  // NOT the examination slug.
  const normalizedEntryCode = entryCode?.trim().toUpperCase() ?? ""

  // Keep support for legacy 32-character entry codes
  // until previously published examinations are migrated.
  const validEntryCode =
    /^[A-Z0-9]{6,32}$/.test(normalizedEntryCode)

  const takePath =
    hasPublication && validEntryCode
      ? `/take/${encodeURIComponent(normalizedEntryCode)}`
      : null

  const [takeUrl, setTakeUrl] = useState<string | null>(null)

  useEffect(() => {
    setTakeUrl(
      takePath
        ? new URL(takePath, window.location.origin).toString()
        : null
    )
  }, [takePath])

  const isPrivate = accessMode === "access_code"
  const isPublic = accessMode === "open_link"
  const isRegistered = accessMode === "registered"

  const modeLabel = accessMode
    ? modeLabels[accessMode]
    : "Not published"

  const readyCount = credentialsReadyCount ?? 0
  const missingCount = credentialsMissingCount ?? 0

  const canDownload =
    hasPublication &&
    isPrivate &&
    readyCount > 0 &&
    Boolean(downloadHref)

  return (
    <section
      aria-label="Candidate access information"
      className={cn(
        "space-y-4 rounded-xl border bg-background p-4 sm:p-5",
        className
      )}
    >
      {/* Heading */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">
            Candidate access
          </h2>

          <p className="text-sm ">
            Share the examination link and manage how candidates
            access this examination.
          </p>
        </div>

        <Badge variant="secondary" className="gap-1.5 shadow-none">
          <ShieldCheck className="size-3.5" />
          {modeLabel}
        </Badge>
      </div>

      {/* Statistics */}
      {hasPublication && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat
            label="Assigned candidates"
            value={assignedCount}
            icon={<UsersRound className="size-4" />}
          />

          {isPrivate && (
            <>
              <Stat
                label="Codes ready"
                value={credentialsReadyCount ?? "—"}
                icon={<KeyRound className="size-4" />}
              />

              <Stat
                label="Codes needed"
                value={credentialsMissingCount ?? "—"}
                icon={<KeyRound className="size-4" />}
              />
            </>
          )}
        </div>
      )}

      {/* Access details */}
      {hasPublication ? (
        <div className="space-y-3">
          {takeUrl && takePath ? (
            <>
              <CopyValue
                label={
                  isPublic
                    ? "Public examination link"
                    : "Take examination link"
                }
                value={takeUrl}
              />

              {isPrivate && (
                <CopyValue
                  label="Examination entry code"
                  value={normalizedEntryCode}
                />
              )}

              {/* Access instructions */}
              <div className="rounded-lg border border-primary/15 bg-primary/5 p-3">
                {isPrivate && (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      How students access this examination
                    </p>

                    <p className="text-xs leading-5 ">
                      Share the examination link with students.
                      Each student signs in using their candidate
                      code and six-character personal access code.
                    </p>
                  </div>
                )}

                {isPublic && (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      Public examination access
                    </p>

                    <p className="text-xs leading-5 ">
                      Candidates can open the examination link
                      and register using their names, subject to
                      the examination's availability and entry rules.
                    </p>
                  </div>
                )}

                {isRegistered && (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      Registered candidate access
                    </p>

                    <p className="text-xs leading-5 ">
                      Assigned candidates must use their registered
                      accounts to access this examination.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="shadow-none"
                >
                  <a
                    href={takePath}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-4" />
                    Open exam link
                  </a>
                </Button>

                <DownloadExamCredentialsButton
                  downloadHref={canDownload ? downloadHref : null}
                />

                {/* {canDownload && (
                  <Button
                    asChild
                    size="sm"
                    className="shadow-none"
                  >
                    <a href={downloadHref!}>
                      <Download className="size-4" />
                      Download credentials
                    </a>
                  </Button>
                )} */}
              </div>

              {isPrivate && missingCount > 0 && (
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300" />

                  <p className="text-xs leading-5 ">
                    {missingCount.toLocaleString()} assigned{" "}
                    {missingCount === 1
                      ? "candidate still needs"
                      : "candidates still need"}{" "}
                    downloadable access credentials.
                    Complete credential preparation before
                    distributing the file.
                  </p>
                </div>
              )}

              {isPrivate &&
                assignedCount > 0 &&
                readyCount === 0 &&
                missingCount === 0 && (
                  <p className="text-xs ">
                    Credential availability has not been confirmed.
                    Refresh this page if candidates were just assigned.
                  </p>
                )}
            </>
          ) : (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300" />

              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  Examination link unavailable
                </p>

                <p className="text-xs leading-5 ">
                  This publication does not have a valid examination
                  entry code. Check its access configuration
                  before sharing the examination.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-lg border border-dashed p-3 text-sm ">
          <Link2 className="mt-0.5 size-4 shrink-0" />

          Publish this examination to activate its candidate
          access link.
        </div>
      )}

      {accessActions}
    </section>
  )
}
