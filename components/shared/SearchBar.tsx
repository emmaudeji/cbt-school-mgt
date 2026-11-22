"use client"

import * as React from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SearchBarProps = {
  onSearch: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  query?: string
  onChange?: (value: string) => void
  searchAsYouType?: boolean
  minSearchLength?: number
  debounceMs?: number
}

export function SearchBar({
  onSearch,
  placeholder = "Search...",
  className,
  disabled = false,
  query,
  onChange,
  searchAsYouType = false,
  minSearchLength = 3,
  debounceMs = 400,
}: SearchBarProps) {
  const [value, setValue] = React.useState(query ?? "")
  const [error, setError] = React.useState("")

  const lastSearch = React.useRef("")

  const search = React.useCallback(
    (input: string, showError = true) => {
      const searchValue = input.trim()

      if (!searchValue) {
        lastSearch.current = ""
        setError("")
        onSearch("")
        return
      }

      if (searchValue.length < minSearchLength) {
        if (showError) {
          setError(
            `Search must be at least ${minSearchLength} characters.`
          )
        }
        return
      }

      if (searchValue === lastSearch.current) return

      lastSearch.current = searchValue
      setError("")
      onSearch(searchValue)
    },
    [minSearchLength, onSearch]
  )

  React.useEffect(() => {
    if (!searchAsYouType) return

    const searchValue = value.trim()

    if (!searchValue) {
      if (lastSearch.current) {
        lastSearch.current = ""
        onSearch("")
      }
      return
    }

    if (searchValue.length < minSearchLength) return

    const timeout = window.setTimeout(() => {
      search(searchValue, false)
    }, debounceMs)

    return () => window.clearTimeout(timeout)
  }, [
    value,
    searchAsYouType,
    minSearchLength,
    debounceMs,
    search,
    onSearch,
  ])

  const handleSearch = () => {
    search(value)
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <div className={cn("w-full sm:max-w-sm", className)}>
      <div className="relative">
        <Input
          type="search"
          value={value}
          onChange={(e) => {
            const nextValue = e.target.value

            setValue(nextValue)
            onChange?.(nextValue)

            if (error) setError("")
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "h-10 rounded-full border-border/50 bg-card pr-11",
            error &&
              "border-destructive focus-visible:ring-destructive"
          )}
        />

        <Button
          type="button"
          size="icon-sm"
          onClick={handleSearch}
          disabled={disabled}
          className="absolute right-1 top-1 rounded-full"
          aria-label="Search"
        >
          <Search className="size-3.5" />
        </Button>
      </div>

      {error && (
        <p
          className="mt-1.5 px-4 text-xs text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}