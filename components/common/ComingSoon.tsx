
import { Construction, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface ComingSoonProps {
  title?: string
  description?: string
  fullScreen?: boolean
  className?: string
}

export default function ComingSoon({
  title = "Something exciting is coming!",
  description = "We're working on this section. It will be available soon.",
  fullScreen = false,
  className,
}: ComingSoonProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-5 px-6 py-10 text-center",
        fullScreen ? "min-h-dvh" : "min-h-[50vh]",
        className
      )}
    >
      <div className="relative flex size-20 items-center justify-center rounded-3xl bg-primary/10">
        <Construction className="size-9 text-primary" />

        <Sparkles className="absolute -right-2 -top-2 size-6 text-[var(--brand-accent)]" />
      </div>

      <div className="max-w-md space-y-3">
        <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          Coming soon
        </span>

        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h2>

        <p className="text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}
