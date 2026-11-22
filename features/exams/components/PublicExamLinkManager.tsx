
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Copy, Globe2, Loader2 } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createPublicExamLinkAction } from "../public/services/action"

 
type Props = {
  examId: string
  slug: string
  accessMode: string | null
  entryCode: string | null
  availableFrom: string
  availableUntil: string
}

function toLocal(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ""

  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  )

  return local.toISOString().slice(0, 16)
}

export function PublicExamLinkManager({
  examId,
  slug,
  accessMode,
  entryCode,
  availableFrom,
  availableUntil,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [start, setStart] = useState(
    toLocal(availableFrom)
  )

  const [end, setEnd] = useState(
    toLocal(availableUntil)
  )

  const isPublic = accessMode === "open_link" && !!entryCode

  const link =
    typeof window !== "undefined" && entryCode
      ? `${window.location.origin}/take/${entryCode}`
      : entryCode
        ? `/take/${entryCode}`
        : ""

  const createLink = () => {
    if (pending) return

    if (!start || !end) {
      toast.error("Select the examination availability dates.")
      return
    }

    startTransition(async () => {
      const result = await createPublicExamLinkAction(
        examId,
        slug,
        new Date(start).toISOString(),
        new Date(end).toISOString()
      )

      if (!result.success) {
        toast.error(result.error ?? "Unable to create public link.")
        return
      }

      toast.success("Public examination link created.")
      router.refresh()
    })
  }

  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-none">
      <CardHeader className="border-b py-4">
        <div className="flex items-center gap-2">
          <Globe2 className="size-4 text-muted-foreground" />
          <CardTitle className="text-base">
            Public Examination Link
          </CardTitle>
        </div>

        <CardDescription>
          Allow participants to join without organization accounts.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 py-5">
        {isPublic ? (
          <>
            <p className="text-sm text-muted-foreground">
              Your public examination is ready to share.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={link}
                readOnly
                aria-label="Public examination link"
              />

              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(link)
                  toast.success("Examination link copied.")
                }}
              >
                <Copy className="size-4" />
                Copy Link
              </Button>
            </div>

            <Button asChild variant="outline" size="sm">
              <a
                href={`/take/${entryCode}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Public Page
              </a>
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Create a separate public-link revision using
              the current published questions and settings.
              Existing registered-candidate assignments
              will remain attached to their original revision.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="public-start">
                  Available From
                </Label>

                <Input
                  id="public-start"
                  type="datetime-local"
                  value={start}
                  onChange={(event) =>
                    setStart(event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="public-end">
                  Available Until
                </Label>

                <Input
                  id="public-end"
                  type="datetime-local"
                  value={end}
                  onChange={(event) =>
                    setEnd(event.target.value)
                  }
                />
              </div>
            </div>

            <Button
              type="button"
              disabled={pending || !start || !end}
              onClick={createLink}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Globe2 className="size-4" />
              )}
              Create Public Link
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
