
"use client"

import * as React from "react"
import { Maximize2, Minimize2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const DESKTOP_QUERY = "(min-width: 1024px)"

export function useMediaQuery(
  query: string,
  defaultValue = false
) {
  const subscribe = React.useCallback(
    (callback: () => void) => {
      const media = window.matchMedia(query)

      media.addEventListener("change", callback)

      return () => {
        media.removeEventListener("change", callback)
      }
    },
    [query]
  )

  const getSnapshot = React.useCallback(
    () => window.matchMedia(query).matches,
    [query]
  )

  const getServerSnapshot = React.useCallback(
    () => defaultValue,
    [defaultValue]
  )

  return React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )
}

type DrawerSize = "sm" | "md" | "lg"

interface AppDrawerProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactElement
  title?: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  size?: DrawerSize
  showHeader?: boolean
  showClose?: boolean
  expandable?: boolean
  defaultExpanded?: boolean
  className?: string
  headerClassName?: string
  contentClassName?: string
  footerClassName?: string
}

const desktopSizes: Record<DrawerSize, string> = {
  sm: "lg:w-[28rem]",
  md: "lg:w-[36rem]",
  lg: "lg:w-[48rem]",
}

export function AppDrawer({
  children,
  open,
  onOpenChange,
  trigger,
  title,
  description,
  footer,
  size = "md",
  showHeader = true,
  showClose = true,
  expandable = false,
  defaultExpanded = false,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
}: AppDrawerProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)

  const [expanded, setExpanded] =
    React.useState(defaultExpanded)

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setExpanded(defaultExpanded)
    }

    onOpenChange?.(nextOpen)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={handleOpenChange}
    >
      {trigger && (
        <SheetTrigger asChild>{trigger}</SheetTrigger>
      )}

      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        showCloseButton={false}
        className={cn(
          "flex flex-col gap-0 overflow-hidden bg-background p-0",

          isDesktop
            ? cn(
                "h-dvh border-l",
                expanded
                  ? "w-[calc(100vw-3rem)] max-w-none xl:w-[80vw]"
                  : desktopSizes[size]
              )
            : cn(
                "max-h-[92dvh] w-full max-w-none",
                "rounded-t-3xl border-x-0 border-b-0",
                "pb-[env(safe-area-inset-bottom)]"
              ),

          className
        )}
      >
        {!isDesktop && (
          <MobileDrawerBar showClose={showClose} />
        )}

        {showHeader && (
          <SheetHeader
            className={cn(
              "shrink-0 space-y-0 border-b px-5 py-4 text-left",
              "sm:px-6",
              isDesktop && "py-5",
              headerClassName
            )}
          >
            <div className="flex min-w-0 items-start justify-between gap-4">
              <div className="min-w-0">
                {title && (
                  <SheetTitle className="text-base font-semibold tracking-tight sm:text-lg">
                    {title}
                  </SheetTitle>
                )}

                {description && (
                  <SheetDescription className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">
                    {description}
                  </SheetDescription>
                )}
              </div>

              {isDesktop && (
                <DrawerActions
                  expanded={expanded}
                  expandable={expandable}
                  showClose={showClose}
                  onExpand={() =>
                    setExpanded((current) => !current)
                  }
                />
              )}
            </div>
          </SheetHeader>
        )}

        {!showHeader && isDesktop && (
          <div className="absolute right-3 top-3 z-20">
            <DrawerActions
              expanded={expanded}
              expandable={expandable}
              showClose={showClose}
              onExpand={() =>
                setExpanded((current) => !current)
              }
            />
          </div>
        )}

        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain",
            contentClassName
          )}
        >
          {children}
        </div>

        {footer && (
          <SheetFooter
            className={cn(
              "shrink-0 border-t px-5 py-3 sm:px-6",
              "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
              footerClassName
            )}
          >
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}

function MobileDrawerBar({
  showClose,
}: {
  showClose: boolean
}) {
  return (
    <div className="relative flex h-9 shrink-0 items-center justify-center">
      <div
        aria-hidden="true"
        className="h-1 w-10 rounded-full bg-foreground/15"
      />

      {showClose && (
        <SheetClose asChild className="absolute right-3 top-1 size-8 rounded-full bg-primary text-primary-foreground">
          <X/>
        </SheetClose>
      )}
    </div>
  )
}

interface DrawerActionsProps {
  expanded: boolean
  expandable: boolean
  showClose: boolean
  onExpand: () => void
}

function DrawerActions({
  expanded,
  expandable,
  showClose,
  onExpand,
}: DrawerActionsProps) {
  if (!expandable && !showClose) {
    return null
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      {expandable && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 rounded-full"
          onClick={onExpand}
          aria-label={
            expanded ? "Reduce panel" : "Expand panel"
          }
        >
          {expanded ? (
            <Minimize2 className="size-4" />
          ) : (
            <Maximize2 className="size-4" />
          )}
        </Button>
      )}

      {showClose && (
        <SheetClose asChild className="absolute right-3 top-1 size-8 rounded-full bg-primary text-primary-foreground">
          <X/>
        </SheetClose>
      )}
    </div>
  )
}
