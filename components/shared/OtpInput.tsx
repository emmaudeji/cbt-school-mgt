// components/ui/otp-input.tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type OtpInputProps = {
  length?: number
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export function OtpInput({ length = 8, value, onChange, error, disabled }: OtpInputProps) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? "")

  const setDigit = (index: number, char: string) => {
    const next = digits.slice()
    next[index] = char
    onChange(next.join(""))
  }

  const handleChange = (index: number, raw: string) => {
    const char = raw.replace(/\D/g, "").slice(-1)
    setDigit(index, char)
    if (char && index < length - 1) refs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length)
    if (!pasted) return
    e.preventDefault()
    onChange(pasted.padEnd(length, "").slice(0, length))
    refs.current[Math.min(pasted.length, length - 1)]?.focus()
  }

  return (
    <div>
      <div
        role="group"
        aria-label="Verification code"
        aria-invalid={!!error}
        className="flex justify-between gap-2"
      >
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el }}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            aria-label={`Digit ${i + 1} of ${length}`}
            className={cn(
              "h-12 w-11 border-0 border-b bg-transparent text-center text-lg outline-none transition-colors",
              "border-border",
              "focus:border-primary",
              error && "border-destructive focus:border-destructive"
            )}
          />
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}