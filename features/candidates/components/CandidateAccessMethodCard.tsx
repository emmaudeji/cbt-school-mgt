import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Props = {
  title: string
  description: string
  icon: LucideIcon
  current: boolean
  available: boolean
  href?: string
  tone: string
}

export function CandidateAccessMethodCard({ title, description, icon: Icon, current, available, href, tone }: Props) {
  return (
    <div className={`flex min-h-56 flex-col rounded-xl border p-4 transition-colors ${current ? "border-primary/50 bg-primary/5" : "border-primary/20 bg-background hover:border-primary/40"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className={`flex size-11 items-center justify-center rounded-xl ${tone}`}><Icon className="size-5" /></div>
        {current ? <Badge className="gap-1"><CheckCircle2 className="size-3" /> Current</Badge> : <Badge variant="outline">{available ? "Available" : "Planned"}</Badge>}
      </div>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-1 flex-1 text-xs leading-5 text-muted-foreground">{description}</p>
      {href && available ? (
        <Button asChild variant={current ? "default" : "outline"} size="sm" className="mt-4"><Link href={href}>Open workspace <ArrowRight className="size-3.5" /></Link></Button>
      ) : <p className="mt-4 text-xs font-medium text-muted-foreground">Workflow coming in a later stage</p>}
    </div>
  )
}
