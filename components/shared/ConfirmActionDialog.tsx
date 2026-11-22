"use client"

import { AlertTriangle, Loader2 } from "lucide-react"
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

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  pending?: boolean
  destructive?: boolean
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  pending = false,
  destructive = false,
}: Props) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) onOpenChange(nextOpen)
      }}
    >
      <AlertDialogContent className="max-w-md border-primary/25 shadow-none">
        <AlertDialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
            <AlertTriangle className="size-5 text-primary" />
          </div>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-6 text-foreground/75">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Keep Draft</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className={
              destructive
                ? "bg-destructive text-white hover:bg-destructive/90"
                : ""
            }
            onClick={(event) => {
              event.preventDefault()
              if (!pending) onConfirm()
            }}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {pending ? "Processing..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
