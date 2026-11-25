// "use client"

// import { useState, useTransition } from "react"
// import { useRouter } from "next/navigation"

// import {
//   AlertTriangle,
//   Loader2,
//   RotateCcw,
//   Wrench,
// } from "lucide-react"

// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "@/components/ui/alert-dialog"

// import { Button } from "@/components/ui/button"

// import {
//   recoverExamStudentResult,
// } from "../services/recover-exam-result-action"

// import type {
//   SyncRow,
// } from "../services/exam-sync-results"

// type Props = {
//   slug: string
//   row: SyncRow
// }

// export function ExamResultRecoveryAction({
//   slug,
//   row,
// }: Props) {
//   const router = useRouter()

//   const [open, setOpen] = useState(false)
//   const [pending, startTransition] = useTransition()
//   const [message, setMessage] = useState("")
//   const [successful, setSuccessful] = useState(false)

//   const canRecover =
//     Boolean(row.attempt_id) &&
//     (
//       row.sync_status === "pending" ||
//       row.sync_status === "ready"
//     )

//   if (!canRecover || !row.attempt_id) {
//     return (
//       <span className="text-xs text-muted-foreground">
//         —
//       </span>
//     )
//   }

//   const isSyncOnly = row.sync_status === "ready"

//   function handleRecover() {
//     if (!row.attempt_id) return

//     setMessage("")

//     startTransition(async () => {
//       const result = await recoverExamStudentResult(
//         slug,
//         row.link_id,
//         row.student_id,
//         row.attempt_id!
//       )

//       setSuccessful(result.ok)
//       setMessage(result.message)

//       if (result.ok) {
//         setOpen(false)
//         router.refresh()
//       }
//     })
//   }

//   return (
//     <div className="flex flex-col items-start gap-1.5">
//       <AlertDialog
//         open={open}
//         onOpenChange={(value) => {
//           if (!pending) setOpen(value)
//         }}
//       >
//         <AlertDialogTrigger asChild>
//           <Button
//             type="button"
//             size="sm"
//             variant="outline"
//             disabled={pending}
//             className="h-8 gap-1.5 whitespace-nowrap shadow-none"
//           >
//             {pending ? (
//               <Loader2 className="size-3.5 animate-spin" />
//             ) : isSyncOnly ? (
//               <RotateCcw className="size-3.5" />
//             ) : (
//               <Wrench className="size-3.5" />
//             )}

//             {isSyncOnly ? "Sync" : "Recover"}
//           </Button>
//         </AlertDialogTrigger>

//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>
//               {isSyncOnly
//                 ? "Synchronize this result?"
//                 : "Recover examination result?"}
//             </AlertDialogTitle>

//             <AlertDialogDescription>
//               {row.student_name} · {row.class_name} ·{" "}
//               {row.subject_name}
//             </AlertDialogDescription>
//           </AlertDialogHeader>

//           <div className="space-y-3 rounded-lg border p-3 text-sm">
//             <p>
//               <strong>Assessment:</strong>{" "}
//               {row.component_name}
//             </p>

//             <p>
//               <strong>Attempt:</strong>{" "}
//               {row.attempt_number ?? "Unknown"}
//             </p>

//             <p>
//               <strong>Current status:</strong>{" "}
//               {row.sync_status.replaceAll("_", " ")}
//             </p>
//           </div>

//           <div className="flex items-start gap-2 text-xs text-muted-foreground">
//             <AlertTriangle className="mt-0.5 size-4 shrink-0" />

//             <p>
//               {isSyncOnly
//                 ? "The system will synchronize this finalized CBT result if the school assessment is still eligible."
//                 : "The system will check the attempt, finalize expired or incomplete objective grading where appropriate, then synchronize any eligible school score. Existing marks will not be overwritten."}
//             </p>
//           </div>

//           {message && !successful && (
//             <p
//               role="alert"
//               className="text-sm text-destructive"
//             >
//               {message}
//             </p>
//           )}

//           <AlertDialogFooter>
//             <AlertDialogCancel disabled={pending}>
//               Cancel
//             </AlertDialogCancel>

//             <AlertDialogAction
//               disabled={pending}
//               onClick={(event) => {
//                 event.preventDefault()
//                 handleRecover()
//               }}
//             >
//               {pending ? (
//                 <Loader2 className="size-4 animate-spin" />
//               ) : (
//                 <RotateCcw className="size-4" />
//               )}

//               {pending
//                 ? "Processing..."
//                 : isSyncOnly
//                   ? "Confirm sync"
//                   : "Confirm recovery"}
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>

//       {message && successful && (
//         <p
//           role="status"
//           className="max-w-44 text-xs text-emerald-700 dark:text-emerald-400"
//         >
//           {message}
//         </p>
//       )}
//     </div>
//   )
// }