
"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Pencil, Save } from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { updateExamSectionAction } from "../services/action.updateExamSection"

type Template = {
  id: string
  title: string
}

type Props = {
  examId: string
  sectionId: string
  title: string
  instructions: string | null
  templateId: string | null
  templates: Template[]
  usedTemplateIds: (string | null)[]
  disabled?: boolean
}

export function EditExamSectionButton({
  examId,
  sectionId,
  title,
  instructions,
  templateId,
  templates,
  usedTemplateIds,
  disabled = false,
}: Props) {
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const [mode, setMode] = useState<"custom" | "template">(
    templateId ? "template" : "custom"
  )

  const [name, setName] = useState(title)
  const [selectedTemplateId, setSelectedTemplateId] =
    useState(templateId ?? "")

  const [sectionInstructions, setSectionInstructions] =
    useState(instructions ?? "")

  useEffect(() => {
    if (!open) return

    setMode(templateId ? "template" : "custom")
    setName(title)
    setSelectedTemplateId(templateId ?? "")
    setSectionInstructions(instructions ?? "")
  }, [open, title, templateId, instructions])

  const availableTemplates = templates.filter(
    item =>
      item.id === templateId ||
      !usedTemplateIds.includes(item.id)
  )

  const canSave =
    !pending &&
    !disabled &&
    (mode === "custom"
      ? name.trim().length > 0 &&
        name.trim().length <= 120
      : Boolean(selectedTemplateId))

  const save = () => {
    if (!canSave) return

    startTransition(async () => {
      try {
        const result = await updateExamSectionAction({
          examId,
          sectionId,
          title: name,
          instructions: sectionInstructions,
          templateId:
            mode === "template"
              ? selectedTemplateId
              : null,
        })

        if (!result.success) {
          toast.error(
            result.error ?? "Unable to update section."
          )
          return
        }

        toast.success("Section updated successfully.")
        setOpen(false)
        router.refresh()
      } catch (error) {
        console.error("[CBT:EDIT_SECTION]", error)
        toast.error("Unable to update section.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          className="h-8 gap-1.5 border-sky-500/25 bg-sky-500/5 px-2.5 text-xs font-semibold text-sky-700 shadow-none hover:bg-sky-500/10 dark:text-sky-300"
        >
          <Pencil className="size-3.5" />
          <span className="hidden sm:inline">Edit</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md gap-5 shadow-none">
        <DialogHeader>
          <DialogTitle>Edit Section</DialogTitle>
          <DialogDescription>
            Change the section used in this examination.
            Its questions will remain in place.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "custom" ? "default" : "outline"}
              onClick={() => {
                setMode("custom")
                setName(title)
              }}
              disabled={pending}
              className="shadow-none"
            >
              Custom Name
            </Button>

            <Button
              type="button"
              size="sm"
              variant={mode === "template" ? "default" : "outline"}
              onClick={() => setMode("template")}
              disabled={pending}
              className="shadow-none"
            >
              Existing Section
            </Button>
          </div>

          {mode === "custom" ? (
            <div className="space-y-2">
              <Label htmlFor={`section-title-${sectionId}`}>
                Section Name
              </Label>

              <Input
                id={`section-title-${sectionId}`}
                value={name}
                onChange={event =>
                  setName(event.target.value)
                }
                maxLength={120}
                disabled={pending}
                placeholder="e.g. Section A"
              />

              <p className="text-xs text-muted-foreground">
                Renaming here affects this examination only.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor={`section-template-${sectionId}`}>
                Choose Section
              </Label>

              <select
                id={`section-template-${sectionId}`}
                value={selectedTemplateId}
                onChange={event =>
                  setSelectedTemplateId(event.target.value)
                }
                disabled={pending}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select existing section</option>

                {availableTemplates.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor={`section-instructions-${sectionId}`}>
              Instructions (optional)
            </Label>

            <Textarea
              id={`section-instructions-${sectionId}`}
              value={sectionInstructions}
              onChange={event =>
                setSectionInstructions(event.target.value)
              }
              rows={3}
              maxLength={1000}
              disabled={pending}
              placeholder="Instructions for questions in this section"
            />
          </div>

          <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-xs leading-5 text-foreground/85">
            All existing questions and their order will be preserved.
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
            className="shadow-none"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={save}
            disabled={!canSave}
            className="shadow-none"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}

            {pending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
