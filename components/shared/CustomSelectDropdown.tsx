"use client"

import { useEffect, useState } from "react"
import { Check, ChevronDown, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface Option {
  label: string
  value: string
}

interface CustomSelectDropdownProps {
  name: string
  label?: string
  options: Array<Option | string>
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  required?: boolean
  className?: string
  disabled?: boolean
  description?: string
  labelStyle?: string
  allowCustom?: boolean
  customLabel?: string
}

const normalizeOptions = (options: Array<Option | string>): Option[] =>
  options.map(option =>
    typeof option === "string"
      ? { label: option, value: option }
      : option
  )

export function CustomSelectDropdown({
  name,
  label,
  description,
  error,
  required = false,
  value,
  onChange,
  placeholder = "Select an option",
  options,
  className,
  disabled = false,
  labelStyle,
  allowCustom = false,
  customLabel = "Add another",
}: CustomSelectDropdownProps) {
  const [customOpen, setCustomOpen] = useState(false)
  const [customValue, setCustomValue] = useState("")
  const [optionList, setOptionList] = useState<Option[]>(() =>
    normalizeOptions(options)
  )

  useEffect(() => {
    setOptionList(current => {
      const incoming = normalizeOptions(options)
      const custom = current.filter(
        item => !incoming.some(option => option.value === item.value)
      )

      return [...incoming, ...custom]
    })
  }, [options])

  const selected = optionList.find(option => option.value === value)
  const selectedLabel = selected?.label || value

  const closeCustom = () => {
    setCustomValue("")
    setCustomOpen(false)
  }

  const applyCustom = () => {
    const next = customValue.trim()
    if (!next) return

    const exists = optionList.some(
      option => option.value.toLowerCase() === next.toLowerCase()
    )

    if (!exists) {
      setOptionList(current => [
        ...current,
        { label: next, value: next },
      ])
    }

    onChange(
      optionList.find(
        option => option.value.toLowerCase() === next.toLowerCase()
      )?.value || next
    )

    closeCustom()
  }

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="mb-1">
          <Label
            htmlFor={name}
            className={cn("flex items-center gap-1 text-sm", labelStyle)}
          >
            {label}
            {required && (
              <span className="text-destructive">*</span>
            )}
          </Label>

          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}

      {customOpen ? (
        <div className="flex items-center gap-1">
          <Input
            id={name}
            autoFocus
            value={customValue}
            placeholder="Enter position"
            disabled={disabled}
            onChange={e => setCustomValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault()
                applyCustom()
              }

              if (e.key === "Escape") {
                e.preventDefault()
                closeCustom()
              }
            }}
            className={cn(
              "h-10 bg-transparent border border-border rounded-md",
              error && "border-destructive"
            )}
          />

          <Button
            type="button"
            size="sm"
            className="h-10 rounded-md"
            disabled={disabled || !customValue.trim()}
            onClick={applyCustom}
          >
            Add
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6 shrink-0"
            onClick={closeCustom}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={disabled}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-border bg-background px-3 text-sm",
              !value && "text-muted-foreground",
              error && "border-destructive"
            )}
          >
            <span className="truncate">
              {selectedLabel || placeholder}
            </span>

            <ChevronDown className="ml-2 size-4 shrink-0 opacity-60" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            className="w-[var(--anchor-width)] min-w-56 rounded-md"
          >
            {optionList.map(option => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onChange(option.value)}
                className="flex cursor-pointer items-center justify-between"
              >
                <span>{option.label}</span>

                {value === option.value && (
                  <Check className="size-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}

            {allowCustom && (
              <>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => setCustomOpen(true)}
                  className="cursor-pointer font-medium"
                >
                  <Plus className="size-4" />
                  {customLabel}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {error && (
        <p className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}