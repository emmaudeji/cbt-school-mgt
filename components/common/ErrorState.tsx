
"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorStateProps {
  header?: string
  text?: string
  onRetry?: () => void
  fullScreen?: boolean
  className?: string
}

export default function ErrorState({
  header = "Oops! Something went wrong",
  text = "We couldn't load this page right now. Please try again.",
  onRetry,
  fullScreen = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex w-full flex-col items-center justify-center gap-5 px-4 py-10 text-center",
        fullScreen ? "min-h-dvh" : "min-h-[50vh]",
        className
      )}
    >
      <div className="flex size-20 items-center justify-center rounded-3xl bg-destructive/10">
        <AlertCircle className="size-9 text-destructive" />
      </div>

      <div className="max-w-sm space-y-2">
        <h2 className="text-lg font-semibold text-foreground">
          {header}
        </h2>

        {text && (
          <p className="text-sm leading-6 text-muted-foreground">
            {text}
          </p>
        )}
      </div>

      {onRetry && (
        <Button
          type="button"
          onClick={onRetry}
          className="mt-1 gap-2 rounded-xl"
        >
          <RefreshCw className="size-4" />
          Try again
        </Button>
      )}
    </div>
  )
}
