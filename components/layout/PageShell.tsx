import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { DashboardHeader } from "./DashboardHeader"
import Copyright from "../shared/CopyRight"

interface PageShellProps {
  children: ReactNode
  header?: ReactNode
  footer?: ReactNode
  className?: string
  containerClassName?: string
  fluid?: boolean
  noHeader?: boolean
  noFooter?: boolean
}

export function PageShell({
  children, 
  header = <DashboardHeader/>, 
  footer, 
  className, 
  containerClassName,
  fluid = false,
  noHeader = false,
  noFooter = true,
}: PageShellProps) {
  return (
    <div className={cn("flex min-h-dvh justify-between min-w-0 flex-col bg-background text-foreground", containerClassName)}>
    {!noHeader && header && (
        <header className="shrink-0 border-b bg-card text-card-foreground">
          {header}
        </header>
      )}

      <main className={cn(
        "flex min-w-0 flex-1 flex-col px-4 2xl:px-8 w-full mx-auto py-4",
        !fluid && "max-w-[1600px]",
        className
      )}>
        {children}
      </main>
      
      {!noFooter && <footer className="mt-auto shrink-0 border-t h-8 flex-center bg-card text-card-foreground">
        <Copyright/>
      </footer>}
     </div>

  )
}