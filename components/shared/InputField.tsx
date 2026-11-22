"use client"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Field } from "./Field"
import { LucideIcon } from "lucide-react"

interface InputFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
  error?: string
  icon?: LucideIcon
  containerStyle?: string
  variant?: "default" | "underline"
}

export const InputField = ({
  label,
  description,
  error,
  icon: Icon,
  required,
  className,
  containerStyle,
  type = "text",
  ...props
}: InputFieldProps) => {
  return (
    <Field
      label={label}
      description={description}
      error={error}
      required={required}
      htmlFor={props.name}
    >
      <div
        className={cn(
          "group flex h-11 items-center gap-2 rounded-md border bg-background px-3",
          "transition-all duration-200",
          "focus-within:border-primary",
          props.disabled && "cursor-not-allowed border-border opacity-60",
          error && "border-destructive",
          containerStyle
        )}
        aria-disabled={props.disabled}
      >
        {Icon && (
          <Icon className="size-4 shrink-0 text-muted-foreground" />
        )}

        <Input
          {...props}
          id={props.name}
          type={type}
          required={required}
          className={cn(
            "h-auto rounded-none border-none bg-transparent p-0 shadow-none",
            "focus-visible:ring-0 dark:bg-transparent",
            className
          )}
        />
      </div>
    </Field>
  )
} 