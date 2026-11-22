
"use client"

import type { ReactElement, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface PopoverMenuProps {
  trigger?: ReactElement
  children: ReactNode
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  align?: "start" | "center" | "end"
  matchTriggerWidth?: boolean
}

export function PopoverMenu({
  trigger = <Button variant="outline">Open</Button>,
  children,
  className,
  open,
  onOpenChange,
  align = "start",
  matchTriggerWidth = false,
}: PopoverMenuProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>

      <PopoverContent
        align={align}
        className={cn(
          "rounded-md p-0",
          matchTriggerWidth && "w-[var(--radix-popover-trigger-width)]",
          className
        )}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}
