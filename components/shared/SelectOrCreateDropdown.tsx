
"use client"

import { useState } from "react"
import {
  Check,
  ChevronDown,
  Loader2,
  Plus,
  X,
} from "lucide-react"
import { toast } from "react-toastify"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type SelectOption = {
  id: string
  name: string
}

type ActionResult = {
  success: boolean
  error?: string
  data?: SelectOption
}

type Props = {
  label: string
  description?: string
  placeholder: string
  createLabel: string
  name: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  onCreate: (name: string) => Promise<ActionResult>
  onCreated: (option: SelectOption) => void

  // Reusable options not yet linked to this examination
  // or to its current subject.
  availableOptions?: SelectOption[]
  onUseAvailable?: (id: string) => Promise<ActionResult>

  disabled?: boolean
  required?: boolean
  error?: string
}

export default function SelectOrCreateDropdown({
  label,
  description,
  placeholder,
  createLabel,
  name,
  value,
  options,
  onChange,
  onCreate,
  onCreated,
  availableOptions = [],
  onUseAvailable,
  disabled = false,
  required = false,
  error,
}: Props) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [saving, setSaving] = useState(false)
  const [createError, setCreateError] = useState("")

  const selected = options.find(
    option => option.id === value
  )

  const reusable = onUseAvailable
    ? availableOptions.filter(
        option =>
          !options.some(
            existing =>
              existing.name.trim().toLowerCase() ===
              option.name.trim().toLowerCase()
          )
      )
    : []

  const reset = () => {
    setCreating(false)
    setNewName("")
    setCreateError("")
  }

  const select = (option: SelectOption) => {
    onChange(option.id)
    setOpen(false)
    reset()
  }

  const create = async () => {
    const title = newName.trim()

    if (!title || saving) return

    setSaving(true)
    setCreateError("")

    try {
      const result = await onCreate(title)

      if (!result.success || !result.data) {
        const message =
          result.error ??
          `Unable to create ${label.toLowerCase()}.`

        setCreateError(message)
        toast.error(message)
        return
      }

      onCreated(result.data)
      onChange(result.data.id)

      toast.success(`${label} created and selected.`)

      setOpen(false)
      reset()
    } catch (error) {
      console.error("[CBT:CREATE_OPTION]", error)

      const message = "Unable to save. Please try again."
      setCreateError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const useAvailable = async (id: string) => {
    if (!onUseAvailable || saving) return

    setSaving(true)
    setCreateError("")

    try {
      const result = await onUseAvailable(id)

      if (!result.success || !result.data) {
        toast.error(
          result.error ?? `Unable to select ${label.toLowerCase()}.`
        )
        return
      }

      onCreated(result.data)
      onChange(result.data.id)

      setOpen(false)
      reset()
    } catch (error) {
      console.error("[CBT:USE_OPTION]", error)
      toast.error("Unable to select this option.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label htmlFor={name} className="gap-1 text-foreground">
          {label}
          {required && (
            <span className="text-destructive">*</span>
          )}
        </Label>

        {description && (
          <p className="text-xs leading-relaxed text-foreground/80">
            {description}
          </p>
        )}
      </div>

      <input
        type="hidden"
        name={name}
        value={value}
        required={required}
      />

      <DropdownMenu
        open={open}
        onOpenChange={next => {
          if (saving) return

          setOpen(next)

          if (!next) reset()
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            id={name}
            variant="outline"
            aria-invalid={!!error}
            disabled={disabled || saving}
            className={cn(
              "h-11 w-full justify-between bg-background px-3 text-left font-normal text-foreground shadow-none",
              !selected && "text-foreground/70",
              error && "border-destructive"
            )}
          >
            <span className="truncate">
              {selected?.name ?? placeholder}
            </span>

            {saving ? (
              <Loader2 className="size-4 shrink-0 animate-spin" />
            ) : (
              <ChevronDown className="size-4 shrink-0 opacity-70" />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-64 p-1 shadow-none"
        >
          {creating ? (
            <div className="space-y-3 p-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {createLabel}
                </p>

                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  disabled={saving}
                  onClick={reset}
                >
                  <X className="size-4" />
                </Button>
              </div>

              <Input
                autoFocus
                value={newName}
                placeholder={`Enter ${label.toLowerCase()} name`}
                disabled={saving}
                onChange={event => {
                  setNewName(event.target.value)
                  setCreateError("")
                }}
                onKeyDown={event => {
                  event.stopPropagation()

                  if (event.key === "Enter") {
                    event.preventDefault()
                    void create()
                  }
                }}
              />

              {createError && (
                <p
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {createError}
                </p>
              )}

              <Button
                type="button"
                size="sm"
                className="w-full shadow-none"
                disabled={saving || !newName.trim()}
                onClick={() => void create()}
              >
                {saving && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {saving ? "Saving..." : "Save & Select"}
              </Button>
            </div>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto">
                {options.length > 0 && (
                  <div className="space-y-0.5">
                    {options.map(option => (
                      <DropdownMenuItem
                        key={option.id}
                        disabled={saving}
                        onSelect={() => select(option)}
                        className="flex cursor-pointer justify-between gap-3"
                      >
                        <span className="truncate">
                          {option.name}
                        </span>

                        {value === option.id && (
                          <Check className="size-4 shrink-0 text-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}

                {reusable.length > 0 && (
                  <>
                    {options.length > 0 && (
                      <DropdownMenuSeparator />
                    )}

                    <p className="px-2 py-2 text-xs font-semibold text-foreground/65">
                      Available in your organization
                    </p>

                    {reusable.map(option => (
                      <DropdownMenuItem
                        key={`global-${option.id}`}
                        disabled={saving}
                        onSelect={event => {
                          event.preventDefault()
                          void useAvailable(option.id)
                        }}
                        className="cursor-pointer gap-2"
                      >
                        {saving ? (
                          <Loader2 className="size-4 shrink-0 animate-spin" />
                        ) : (
                          <Plus className="size-4 shrink-0 text-primary" />
                        )}

                        <span className="truncate">
                          {option.name}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}

                {!options.length && !reusable.length && (
                  <p className="px-2 py-4 text-center text-xs text-foreground/70">
                    No options yet. Create the first one below.
                  </p>
                )}
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                disabled={saving}
                onSelect={event => {
                  event.preventDefault()
                  setCreating(true)
                }}
                className="cursor-pointer font-semibold text-primary"
              >
                <Plus className="size-4" />
                {createLabel}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
