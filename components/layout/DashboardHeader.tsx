"use client"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
// import AcademicPeriodSelector from "./AcademicPeriodSelector"
import { SearchBar } from "../shared/SearchBar"

interface DashboardHeaderProps {
  // title: string
  // description?: string
  navigation?: ReactNode
  actions?: ReactNode
  className?: string
}

export function DashboardHeader({
 navigation, 
 actions, 
 className,
}: DashboardHeaderProps) {
  return (
    <div className={cn(
      "pl-14 flex h-12 items-center justify-between gap-2 pr-4 sm:px-6 lg:px-8",
      className
    )}>
      <div className="flex items-center gap-2">
       <SearchBar onSearch={()=>{}} />
      </div>

      <div className="flex  items-center gap-2">
        {/* <AcademicPeriodSelector /> */}
      </div>
    </div>
  )
}