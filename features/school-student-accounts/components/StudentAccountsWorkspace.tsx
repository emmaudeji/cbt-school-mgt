
"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"

import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Search,
  ShieldCheck,
  ShieldOff,
  UserPlus,
  Users,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  changeStudentAccountStatus,
  createStudentAccounts,
  resetStudentPassword,
} from "../services/actions"

import type {
  StudentAccountData,
  StudentAccountRow,
} from "../services/queries"

type Props = {
  data: StudentAccountData
}

type Credential = {
  studentId: string
  name: string
  admissionNumber: string | null
  login: string
  password: string
}

type Confirmation =
  | {
      kind: "create"
      studentIds: string[]
    }
  | {
      kind: "reset"
      studentId: string
      studentName: string
    }
  | {
      kind: "status"
      studentId: string
      studentName: string
      status: "active" | "suspended"
    }

export function StudentAccountsWorkspace({
  data,
}: Props) {
  const router = useRouter()

  const [query, setQuery] = useState(data.search)
  const [selected, setSelected] = useState<string[]>([])
  const [pending, startTransition] = useTransition()

  const [confirmation, setConfirmation] =
    useState<Confirmation | null>(null)

  // Credentials available during the current page session.
  const [issuedCredentials, setIssuedCredentials] =
    useState<Record<string, Credential>>({})

  const [revealed, setRevealed] = useState<string[]>([])

  const [failures, setFailures] = useState<string[]>([])

  // Newly created account credentials shown in
  // the success dialog.
  const [successCredentials, setSuccessCredentials] =
    useState<Credential[]>([])

  const [successFailures, setSuccessFailures] =
    useState<string[]>([])

  const [successOpen, setSuccessOpen] =
    useState(false)

  function clearIssuedCredentials() {
    setIssuedCredentials({})
    setRevealed([])
  }

  function closeSuccessDialog() {
    setSuccessOpen(false)
    setSuccessCredentials([])
    setSuccessFailures([])
  }

  function navigate(
    changes: Record<string, string>
  ) {
    setSelected([])
    clearIssuedCredentials()
    setFailures([])
    setConfirmation(null)
    closeSuccessDialog()

    const params = new URLSearchParams({
      session: data.sessionId,
      class: data.classId,
      search: data.search,
      page: String(data.page),
      ...changes,
    })

    router.push(
      `/school/student-accounts?${params.toString()}`
    )
  }

  const unlinked = data.rows.filter(
    (student) => !student.membership_id
  )

  const visibleIds = unlinked.map(
    (student) => student.student_id
  )

  const allVisibleSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) =>
      selected.includes(id)
    )

  function toggle(
    id: string,
    checked: boolean
  ) {
    setSelected((current) =>
      checked
        ? [...new Set([...current, id])]
        : current.filter((item) => item !== id)
    )
  }

  function toggleVisible(checked: boolean) {
    setSelected(
      checked ? visibleIds : []
    )
  }

  function rememberCredentials(
    credentials: Credential[]
  ) {
    if (!credentials.length) return

    setIssuedCredentials((current) => {
      const next = { ...current }

      for (const credential of credentials) {
        next[credential.studentId] = credential
      }

      return next
    })

    // Keep newly issued passwords hidden by default.
    setRevealed((current) =>
      current.filter(
        (id) =>
          !credentials.some(
            (credential) =>
              credential.studentId === id
          )
      )
    )
  }

  function confirmOperation() {
    if (!confirmation || pending) return

    const request = confirmation

    setConfirmation(null)

    startTransition(async () => {
      try {
        // CREATE ACCOUNTS
        if (request.kind === "create") {
          const result =
            await createStudentAccounts(
              request.studentIds
            )

          rememberCredentials(
            result.credentials
          )

          setFailures(result.failures)

          if (result.credentials.length > 0) {
            // Open success modal with credentials
            // from this operation only.
            setSuccessCredentials(
              result.credentials
            )

            setSuccessFailures(
              result.failures
            )

            setSuccessOpen(true)

            setSelected([])
            router.refresh()

            return
          }

          toast.error(result.message)
          return
        }

        // RESET PASSWORD
        if (request.kind === "reset") {
          const result =
            await resetStudentPassword(
              request.studentId
            )

          rememberCredentials(
            result.credentials
          )

          setFailures(result.failures)

          if (result.ok) {
            toast.success(
              "Password reset successfully. Reveal or copy the new password beneath the student's login."
            )
          } else {
            toast.error(result.message)
          }

          return
        }

        // REVOKE / RESTORE
        const result =
          await changeStudentAccountStatus(
            request.studentId,
            request.status
          )

        if (!result.ok) {
          toast.error(result.message)
          return
        }

        toast.success(result.message)
        router.refresh()
      } catch {
        toast.error(
          "Unable to complete this account operation."
        )
      }
    })
  }

  async function copyText(
    text: string,
    successMessage: string
  ) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(successMessage)
    } catch {
      toast.error(
        "Unable to copy automatically. You can select and copy the credentials manually."
      )
    }
  }

  async function copyCredential(
    credential: Credential
  ) {
    await copyText(
      [
        `Student: ${credential.name}`,
        `Admission ID: ${credential.admissionNumber ?? ""}`,
        `Login: ${credential.login}`,
        `Password: ${credential.password}`,
      ].join("\n"),
      "Student credentials copied."
    )
  }

  async function copyAllCredentials() {
    if (!successCredentials.length) return

    const text = successCredentials
      .map((credential) =>
        [
          credential.name,
          credential.admissionNumber ?? "",
          credential.login,
          credential.password,
        ].join("\t")
      )
      .join("\n")

    await copyText(
      text,
      `${successCredentials.length} student credential(s) copied.`
    )
  }

  const pages = Math.max(
    1,
    Math.ceil(data.total / 25)
  )

  const issuedCount = Object.keys(
    issuedCredentials
  ).length

  function accountStatus(
    student: StudentAccountRow
  ) {
    if (!student.membership_id) {
      return (
        <Badge variant="secondary">
          Unlinked
        </Badge>
      )
    }

    if (student.account_status === "active") {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400">
          Active
        </Badge>
      )
    }

    if (student.account_status === "suspended") {
      return (
        <Badge variant="destructive">
          Revoked
        </Badge>
      )
    }

    return (
      <Badge variant="secondary">
        {student.account_status ?? "Unverified"}
      </Badge>
    )
  }

  const confirmationTitle =
    !confirmation
      ? ""
      : confirmation.kind === "create"
        ? "Create student accounts?"
        : confirmation.kind === "reset"
          ? "Reset student password?"
          : confirmation.status === "suspended"
            ? "Revoke school access?"
            : "Restore school access?"

  const confirmationDescription =
    !confirmation
      ? ""
      : confirmation.kind === "create"
        ? `Generate a school login and an eight-character password for ${confirmation.studentIds.length} student(s). The credentials will be displayed after successful creation.`
        : confirmation.kind === "reset"
          ? `A new password will replace the current password for ${confirmation.studentName}. The previous password will no longer work.`
          : confirmation.status === "suspended"
            ? `Suspend ${confirmation.studentName}'s school membership? School and CBT access must enforce this status.`
            : `Reactivate ${confirmation.studentName}'s school membership?`

  return (
    <div className="space-y-5">
      {/* PAGE HEADER */}
      <div>
        <p className="text-xs text-muted-foreground">
          School Integration
        </p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Student Account Management
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          {data.schoolName} · Create school logins,
          reset passwords and manage access.
        </p>
      </div>

      {/* INFORMATION */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <KeyRound className="mt-0.5 size-5 shrink-0 text-primary" />

          <div className="space-y-1">
            <p className="text-sm font-semibold">
              Administrator-managed accounts
            </p>

            <p className="text-xs leading-5 text-muted-foreground">
              The system generates school login
              credentials for registered students.

              Newly issued passwords can be copied
              from the success dialog or revealed
              beneath each student's login.

              Existing passwords cannot be recovered
              from Supabase Auth. Administrators can
              issue a new password using Reset.
            </p>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Academic Session</Label>

          <Select
            value={data.sessionId}
            onValueChange={(value) =>
              navigate({
                session: value,
                class: "all",
                page: "1",
              })
            }
          >
            <SelectTrigger className="w-full shadow-none">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                All Registered Students
              </SelectItem>

              {data.sessions.map((session) => (
                <SelectItem
                  key={session.id}
                  value={session.id}
                >
                  {session.name}
                  {session.is_current
                    ? " · Current"
                    : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Class</Label>

          <Select
            value={data.classId}
            disabled={data.sessionId === "all"}
            onValueChange={(value) =>
              navigate({
                class: value,
                page: "1",
              })
            }
          >
            <SelectTrigger className="w-full shadow-none">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">
                All Classes
              </SelectItem>

              {data.classes.map((cls) => (
                <SelectItem
                  key={cls.id}
                  value={cls.id}
                >
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* SEARCH */}
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()

          navigate({
            search: query.trim(),
            page: "1",
          })
        }}
      >
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search name or admission number..."
            className="pl-9 shadow-none"
          />
        </div>

        <Button
          type="submit"
          variant="outline"
          className="shadow-none"
        >
          Search
        </Button>
      </form>

      {/* BULK CREATION */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
        <div className="flex items-center gap-3">
          <Checkbox
            aria-label="Select visible students without accounts"
            checked={allVisibleSelected}
            onCheckedChange={(value) =>
              toggleVisible(value === true)
            }
            disabled={!unlinked.length || pending}
          />

          <div>
            <p className="text-sm font-medium">
              {selected.length} selected
            </p>

            <p className="text-xs text-muted-foreground">
              Select students without accounts
              on this page.
            </p>
          </div>
        </div>

        <Button
          type="button"
          disabled={!selected.length || pending}
          onClick={() =>
            setConfirmation({
              kind: "create",
              studentIds: [...selected],
            })
          }
          className="shadow-none"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Users className="size-4" />
          )}

          Create Selected Accounts
        </Button>
      </div>

      {/* ISSUED PASSWORD NOTICE */}
      {issuedCount > 0 && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3"
        >
          <p className="text-xs leading-5">
            <Check className="mr-1 inline size-4 text-emerald-600" />

            {issuedCount} newly issued password(s)
            available in the table. Reveal or copy
            them before leaving this page.
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shadow-none"
            onClick={clearIssuedCredentials}
          >
            Clear Passwords
          </Button>
        </div>
      )}

      {/* ERRORS */}
      {failures.length > 0 && (
        <div
          role="alert"
          className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"
        >
          <p className="text-sm font-semibold">
            Some accounts need attention
          </p>

          {failures.map((message, index) => (
            <p
              key={`${index}-${message}`}
              className="mt-1 text-xs"
            >
              {message}
            </p>
          ))}
        </div>
      )}

      {data.error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {data.error}
        </p>
      )}

      {/* ACCOUNTS TABLE */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-muted/30 text-xs">
            <tr>
              <th className="w-10 px-3 py-3" />

              <th className="px-3 py-3 font-medium">
                Student
              </th>

              <th className="px-3 py-3 font-medium">
                Class
              </th>

              <th className="px-3 py-3 font-medium">
                Login / Password
              </th>

              <th className="px-3 py-3 font-medium">
                Status
              </th>

              <th className="px-3 py-3 text-right font-medium">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {data.rows.map((student) => {
              const credential =
                issuedCredentials[student.student_id]

              const isRevealed =
                revealed.includes(student.student_id)

              const studentName =
                `${student.last_name} ${student.first_name}`

              return (
                <tr
                  key={student.student_id}
                  className="hover:bg-primary/5"
                >
                  {/* SELECT */}
                  <td className="px-3 py-3">
                    {!student.membership_id && (
                      <Checkbox
                        checked={selected.includes(
                          student.student_id
                        )}
                        disabled={pending}
                        onCheckedChange={(value) =>
                          toggle(
                            student.student_id,
                            value === true
                          )
                        }
                        aria-label={`Select ${studentName}`}
                      />
                    )}
                  </td>

                  {/* STUDENT */}
                  <td className="px-3 py-3">
                    <Link
                      href={`/school/students/${student.student_id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {studentName}
                    </Link>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {student.admission_number ??
                        "No admission number"}
                    </p>
                  </td>

                  {/* CLASS */}
                  <td className="px-3 py-3 text-xs">
                    {student.class_name ??
                      "Not placed"}
                  </td>

                  {/* LOGIN / PASSWORD */}
                  <td className="max-w-[340px] px-3 py-3 align-top">
                    <p className="break-all text-xs font-medium">
                      {student.account_email ??
                        credential?.login ??
                        "Not generated"}
                    </p>

                    {credential ? (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs tabular-nums">
                          {isRevealed
                            ? credential.password
                            : "••••••••"}
                        </span>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 shadow-none"
                          title={
                            isRevealed
                              ? "Hide password"
                              : "Reveal password"
                          }
                          aria-label={
                            isRevealed
                              ? `Hide ${studentName}'s password`
                              : `Reveal ${studentName}'s password`
                          }
                          onClick={() =>
                            setRevealed((current) =>
                              isRevealed
                                ? current.filter(
                                    (id) =>
                                      id !==
                                      student.student_id
                                  )
                                : [
                                    ...current,
                                    student.student_id,
                                  ]
                            )
                          }
                        >
                          {isRevealed ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 shadow-none"
                          title="Copy credentials"
                          aria-label={`Copy ${studentName}'s credentials`}
                          onClick={() =>
                            void copyCredential(credential)
                          }
                        >
                          <Copy className="size-4" />
                        </Button>

                        <span className="text-[11px] text-muted-foreground">
                          Newly issued
                        </span>
                      </div>
                    ) : student.membership_id ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Password not available.
                        Reset to issue a new one.
                      </p>
                    ) : null}
                  </td>

                  {/* STATUS */}
                  <td className="px-3 py-3">
                    {accountStatus(student)}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {!student.membership_id ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled={pending}
                          onClick={() =>
                            setConfirmation({
                              kind: "create",
                              studentIds: [
                                student.student_id,
                              ],
                            })
                          }
                          className="shadow-none"
                        >
                          <UserPlus className="size-4" />
                          Create
                        </Button>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={pending}
                            onClick={() =>
                              setConfirmation({
                                kind: "reset",
                                studentId:
                                  student.student_id,
                                studentName,
                              })
                            }
                            className="shadow-none"
                          >
                            <KeyRound className="size-4" />
                            Reset
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={pending}
                            onClick={() =>
                              setConfirmation({
                                kind: "status",
                                studentId:
                                  student.student_id,
                                studentName,
                                status:
                                  student.account_status ===
                                  "suspended"
                                    ? "active"
                                    : "suspended",
                              })
                            }
                            className="shadow-none"
                          >
                            {student.account_status ===
                            "suspended" ? (
                              <ShieldCheck className="size-4" />
                            ) : (
                              <ShieldOff className="size-4" />
                            )}

                            {student.account_status ===
                            "suspended"
                              ? "Restore"
                              : "Revoke"}
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {data.rows.length === 0 && (
          <div className="p-10 text-center">
            <Users className="mx-auto mb-3 size-8 text-muted-foreground" />

            <p className="text-sm font-medium">
              No students found
            </p>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Page {data.page} of {pages}
        </p>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={data.page <= 1 || pending}
            onClick={() =>
              navigate({
                page: String(data.page - 1),
              })
            }
            className="shadow-none"
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={data.page >= pages || pending}
            onClick={() =>
              navigate({
                page: String(data.page + 1),
              })
            }
            className="shadow-none"
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* CONFIRMATION ALERT DIALOG */}
      <AlertDialog
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setConfirmation(null)
          }
        }}
      >
        <AlertDialogContent className="shadow-none">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmationTitle}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {confirmationDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={pending}
              className="shadow-none"
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={pending}
              onClick={(event) => {
                event.preventDefault()
                confirmOperation()
              }}
              className="shadow-none"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SUCCESSFUL ACCOUNT CREATION MODAL */}
      <Dialog
        open={successOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeSuccessDialog()
          }
        }}
      >
        <DialogContent
          className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto shadow-none sm:max-w-2xl"
          showCloseButton={false}
        >
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="size-6 text-emerald-600" />
                </div>

                <div className="space-y-1">
                  <DialogTitle className="text-lg">
                    Student Accounts Created
                  </DialogTitle>

                  <DialogDescription>
                    {successCredentials.length} student
                    account(s) created successfully.
                    Copy the login details before
                    closing this dialog.
                  </DialogDescription>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeSuccessDialog}
                aria-label="Close credentials"
                className="shrink-0 shadow-none"
              >
                <X className="size-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* SUCCESS SUMMARY */}
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />

              <p className="text-sm font-medium">
                {successCredentials.length} account(s)
                ready for students
              </p>
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Each student can sign in using the
              generated school email and password.
            </p>
          </div>

          {/* GENERATED CREDENTIALS */}
          <div className="max-h-[400px] space-y-2 overflow-y-auto pr-1">
            {successCredentials.map((credential) => (
              <div
                key={credential.studentId}
                className="rounded-lg border p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {credential.name}
                    </p>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {credential.admissionNumber ??
                        "No admission number"}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 shadow-none"
                    title="Copy this student's credentials"
                    aria-label={`Copy credentials for ${credential.name}`}
                    onClick={() =>
                      void copyCredential(credential)
                    }
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <div className="min-w-0 space-y-1">
                    <p className="text-[11px] text-muted-foreground">
                      School Login
                    </p>

                    <p className="break-all text-xs font-medium">
                      {credential.login}
                    </p>
                  </div>

                  <div className="space-y-1 sm:min-w-[110px]">
                    <p className="text-[11px] text-muted-foreground">
                      Password
                    </p>

                    <p className="font-mono text-sm font-semibold">
                      {credential.password}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PARTIAL FAILURES */}
          {successFailures.length > 0 && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-sm font-semibold">
                Needs attention
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Some accounts were not completed.
                The credentials above belong only
                to successfully created accounts.
              </p>

              <div className="mt-2 space-y-1">
                {successFailures.map(
                  (message, index) => (
                    <p
                      key={`${index}-${message}`}
                      className="text-xs"
                    >
                      {message}
                    </p>
                  )
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                void copyAllCredentials()
              }
              className="shadow-none"
            >
              <Copy className="size-4" />
              Copy All Credentials
            </Button>

            <Button
              type="button"
              onClick={closeSuccessDialog}
              className="shadow-none"
            >
              <Check className="size-4" />
              Done
            </Button>
          </DialogFooter>

          <p className="text-center text-[11px] text-muted-foreground">
            Closing this dialog keeps the newly issued
            passwords in the table until you clear
            them or leave the page.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
