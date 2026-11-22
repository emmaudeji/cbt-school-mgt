"use client"

import { AlertTriangle, Loader2, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "react-toastify"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { LOG_MESSAGES } from "@/utils/logging/LOG_MESSAGES"

interface ConfirmDeleteCardProps {
  text?: string
  onDelete: () => Promise<void>
  onCancel?: () => void
  trigger?: React.ReactNode
}

export default function DeleteCard({
  text,
  onDelete,
  onCancel,
  trigger,
}: ConfirmDeleteCardProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    try {
      setLoading(true)
      await onDelete()
      setOpen(false)
    } catch (error) {
      console.error(error)
      toast.error(
        LOG_MESSAGES.ERROR.DELETE_FAILED ||
          "Request was unsuccessful, try again"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <button aria-label="Delete item">
            <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600 transition" />
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>

          <DialogTitle className="text-lg font-semibold">
            Confirm Deletion
          </DialogTitle>

          <DialogDescription className="">
            {text ? (
              <>
                <span className="font-medium text-foreground">{text}</span>{" "}
                will be permanently deleted. This action cannot be undone.
              </>
            ) : (
              <>Are you sure you want to delete this item? This action cannot be undone.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => {
              onCancel?.()
              setOpen(false)
            }}
          >
            Cancel
          </Button>

          <Button
            variant="destructive"
            disabled={loading}
            onClick={handleDelete}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
