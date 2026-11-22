
import { Loader2, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"

interface PageLoaderProps {
  header?: string
  text?: string
  fullScreen?: boolean
  className?: string
}

export default function PageLoader({
  header = "Just a moment...",
  text = "We're getting everything ready for you.",
  fullScreen = false,
  className,
}: PageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex w-full flex-col items-center justify-center gap-5 px-4 py-10 text-center",
        fullScreen ? "min-h-dvh" : "min-h-[50vh]",
        className
      )}
    >
      <div className="relative flex size-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-primary/10" />

        <Loader2 className="absolute size-16 animate-spin text-primary/30" />

        <div className="relative flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <GraduationCap className="size-6" />
        </div>
      </div>

      <div className="max-w-sm space-y-1.5">
        <h2 className="text-lg font-semibold text-foreground">
          {header}
        </h2>

        {text && (
          <p className="text-sm leading-6 text-muted-foreground">
            {text}
          </p>
        )}
      </div>
    </div>
  )
}
