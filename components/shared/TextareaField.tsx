"use client"

import { Textarea } from "@/components/ui/textarea"
import { Field } from "./Field"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react";
import { TextareaHTMLAttributes } from "react";

interface TextAreaInputFieldProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string;
  icon?: LucideIcon;
  required?: boolean;
  containerStyle?: string;

  variant?: "default" | "underline";
}


export const TextareaField = ({
  label,
  description,
  error,
  required,
  containerStyle,
  icon,
  variant,
  ...props
}: TextAreaInputFieldProps) => {
  return (
    <Field
      label={label}
      description={description}
      error={error}
      required={required}
      htmlFor={props.name}
      containerStyle={containerStyle}
    >
      <Textarea
        {...props}
        id={props.name}
        className={cn(
          "  rounded-lg",
          "border border-border bg-card dark:bg-transparent focus-visible:border-primary focus-visible:ring-0 p-2  ",
          "transition-all duration-200",
          
          error && "border-destructive"
        )}
      />
    </Field>
  )
}