
"use client"

import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  downloadHref?: string | null
  disabled?: boolean
  label?: string
  size?: "default" | "sm" | "lg" | "icon"
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "link"
  className?: string
}

export function DownloadExamCredentialsButton({
  downloadHref,
  disabled = false,
  label = "Download credentials",
  size = "sm",
  variant = "default",
  className,
}: Props) {
  const available = Boolean(downloadHref) && !disabled

  if (!available) return null

  return (
    <Button
      asChild
      size={size}
      variant={variant}
      className={cn("shadow-none", className)}
    >
      <a href={downloadHref!}>
        <Download className="size-4" />
        {label}
      </a>
    </Button>
  )
}
