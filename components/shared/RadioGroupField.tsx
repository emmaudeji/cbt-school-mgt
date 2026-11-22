
"use client"

import { Field } from "./Field"

interface RadioOption {
  label: string
  value: string
}

interface RadioGroupFieldProps {
  label?: string
  options: RadioOption[]
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

export const RadioGroupField = ({
  label,
  options,
  value,
  onChange,
  error,
  disabled = false,
}: RadioGroupFieldProps) => {
  return (
    <Field label={label} error={error}>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-3">
        {options.map((opt) => {
          const active = value === opt.value

          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={`
                h-10 rounded-full border px-4 text-sm
                transition-colors duration-200
                disabled:cursor-not-allowed disabled:opacity-50
                ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 text-muted-foreground hover:border-primary"
                }
              `}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </Field>
  )
}
