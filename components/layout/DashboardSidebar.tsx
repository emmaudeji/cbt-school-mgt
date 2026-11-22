"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  School,
  Sidebar,
} from "lucide-react"

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useSchoolBranding } from "@/store/branding-store"
import { DashboardNavGroup, DashboardNavItem, isNavActive, isNavItemActive } from "@/components/layout/navigation.types"


/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface DashboardSidebarProps {
  navigation: DashboardNavGroup[]
}

interface SidebarNavigationProps {
  navigation: DashboardNavGroup[]
  expanded: boolean
  onNavigate?: () => void
}

interface SidebarNavItemProps {
  item: DashboardNavItem
  pathname: string
  expanded: boolean
  onNavigate?: () => void
}

/* -------------------------------------------------------------------------- */
/* Shared styles                                                              */
/* -------------------------------------------------------------------------- */

const navItemBase =
  "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 " +
  "text-sm font-medium transition-colors duration-150 " +
  "focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-primary-foreground/60"

const navItemInactive =
  "text-primary-foreground/80 " +
  "hover:bg-primary-foreground/10 " +
  "hover:text-primary-foreground"

const navItemActive =
  "bg-primary-foreground text-primary shadow-sm"

/* -------------------------------------------------------------------------- */
/* Navigation item                                                            */
/* -------------------------------------------------------------------------- */

function SidebarNavItem({
  item,
  pathname,
  expanded,
  onNavigate,
}: SidebarNavItemProps) {
  const active = isNavItemActive(pathname, item)
  const hasChildren = Boolean(item.children?.length)

  const [open, setOpen] = React.useState(active)
  const [previousActive, setPreviousActive] = React.useState(active)

  const Icon = item.icon

  // Automatically expand the group containing the current route.
  if (active !== previousActive) {
    setPreviousActive(active)
    if (active) setOpen(true)
  }

  const itemClass = cn(
    navItemBase,
    active ? navItemActive : navItemInactive
  )

  const label = (
    <span
      className={cn(
        "min-w-0 flex-1 truncate text-left transition-opacity duration-150",
        !expanded && "pointer-events-none opacity-0"
      )}
    >
      {item.title}
    </span>
  )

  // Simple navigation link
  if (!hasChildren && item.href) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        title={!expanded ? item.title : undefined}
        className={itemClass}
      >
        <Icon className="size-5 shrink-0" />

        {label}

        {expanded && item.badge != null && (
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[10px] font-bold",
              active
                ? "bg-primary/10 text-primary"
                : "bg-primary-foreground/15 text-primary-foreground"
            )}
          >
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  if (!hasChildren) return null

  // Navigation group with children
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="space-y-1"
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={itemClass}
          aria-label={!expanded ? item.title : undefined}
          title={!expanded ? item.title : undefined}
        >
          <Icon className="size-5 shrink-0" />

          {label}

          {expanded && (
            <ChevronDown
              className={cn(
                "size-4 shrink-0 transition-transform duration-200",
                open && "rotate-180",
                active
                  ? "text-primary"
                  : "text-primary-foreground/60"
              )}
            />
          )}
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent
        className={cn(
          "overflow-hidden",
          "data-[state=open]:animate-collapsible-down",
          "data-[state=closed]:animate-collapsible-up",
          !expanded && "hidden"
        )}
      >
        <div className="ml-[21px] space-y-1 border-l border-primary-foreground/20 py-1 pl-4">
          {item.children?.map((child) => {
            const childActive = isNavActive(
              pathname,
              child.href,
              child.exact
            )

            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                aria-current={childActive ? "page" : undefined}
                className={cn(
                  "flex min-h-9 items-center justify-between",
                  "rounded-lg px-3 py-2 text-[13px]",
                  "transition-colors",
                  childActive
                    ? "bg-primary-foreground/20 font-semibold text-primary-foreground"
                    : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                )}
              >
                <span className="truncate">
                  {child.title}
                </span>

                {child.badge != null && (
                  <span className="text-[10px]">
                    {child.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

/* -------------------------------------------------------------------------- */
/* Navigation                                                                 */
/* -------------------------------------------------------------------------- */

function SidebarNavigation({
  navigation,
  expanded,
  onNavigate,
}: SidebarNavigationProps) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Dashboard navigation"
      className="scrollbar-thin flex-1 space-y-2 overflow-x-hidden overflow-y-auto px-3 py-5"
    >
      {navigation.map((group) => (
        <div key={group.label} className="space-y-1.5">
          <div
            className={cn(
              "h-5 overflow-hidden px-3",
              "text-[10px] font-bold uppercase",
              "tracking-[0.16em] text-primary-foreground/50",
              "transition-opacity duration-200",
              !expanded && "opacity-0"
            )}
          >
            {group.label}
          </div>

          {group.items.map((item) => (
            <SidebarNavItem
              key={item.href ?? item.title}
              item={item}
              pathname={pathname}
              expanded={expanded}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  )
}

/* -------------------------------------------------------------------------- */
/* School branding                                                            */
/* -------------------------------------------------------------------------- */

function SidebarBrand({
  expanded,
}: {
  expanded: boolean
}) {
  const branding = useSchoolBranding()

  return (
    <Link
      href="/"
      className={cn(
        "flex h-[76px] shrink-0 items-center gap-3",
        "overflow-hidden border-b border-primary-foreground/15",
        "px-[18px]"
      )}
      title={!expanded ? branding.name : undefined}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center",
          "rounded-2xl bg-primary-foreground text-primary",
          "shadow-sm"
        )}
      >
        <School className="size-5" />
      </div>

      <div
        className={cn(
          "min-w-0 flex-1 whitespace-nowrap",
          "transition-opacity duration-200",
          !expanded && "opacity-0"
        )}
      >
        <p className="truncate text-sm font-extrabold tracking-tight text-primary-foreground">
          {branding.shortName || branding.name}
        </p>

        <p className="truncate text-[11px] text-primary-foreground/65">
          CBT Workspace
        </p>
      </div>
    </Link>
  )
}

/* -------------------------------------------------------------------------- */
/* Sidebar footer                                                             */
/* -------------------------------------------------------------------------- */

function SidebarFooter({
  expanded,
  pinned,
  onTogglePin,
}: {
  expanded: boolean
  pinned: boolean
  onTogglePin: () => void
}) {
  const branding = useSchoolBranding()

  return (
    <>
      <div className="border-t border-primary-foreground/15 p-3 xl:hidden">
        <button
          type="button"
          onClick={onTogglePin}
          title={pinned ? "Collapse sidebar" : "Pin sidebar open"}
          aria-label={
            pinned ? "Collapse sidebar" : "Pin sidebar open"
          }
          aria-pressed={pinned}
          className={cn(
            "flex h-11 w-full items-center gap-3",
            "rounded-xl px-3 text-sm",
            "text-primary-foreground/75 transition-colors",
            "hover:bg-primary-foreground/10",
            "hover:text-primary-foreground"
          )}
        >
          {pinned ? (
            <PanelLeftClose className="size-5 shrink-0" />
          ) : (
            <PanelLeftOpen className="size-5 shrink-0" />
          )}

          <span
            className={cn(
              "whitespace-nowrap transition-opacity",
              !expanded && "opacity-0"
            )}
          >
            {pinned ? "Unpin sidebar" : "Pin sidebar open"}
          </span>
        </button>
      </div>

      <div className="hidden border-t border-primary-foreground/15 px-6 py-4 text-xs text-primary-foreground/60 xl:block">
        <p className="truncate">
          {branding.motto ?? "Learning and excellence"}
        </p>
      </div>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Sidebar background                                                         */
/* -------------------------------------------------------------------------- */

function SidebarDecorations() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className={cn(
          "absolute -left-20 top-28 size-52",
          "rounded-full bg-primary-foreground/10 blur-3xl"
        )}
      />

      <div
        className={cn(
          "absolute -right-20 bottom-16 size-56 rounded-full blur-3xl"
        )}
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--brand-accent) 20%, transparent)",
        }}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Main sidebar                                                               */
/* -------------------------------------------------------------------------- */

export function DashboardSidebar({
  navigation,
}: DashboardSidebarProps) {
  const [pinned, setPinned] = React.useState(false)
  const [hovered, setHovered] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const isWideScreen = React.useSyncExternalStore(
    (callback) => {
      const query = window.matchMedia("(min-width: 1280px)")

      query.addEventListener("change", callback)

      return () => query.removeEventListener("change", callback)
    },
    () => window.matchMedia("(min-width: 1280px)").matches,
    () => false
  )

  const expanded = isWideScreen || pinned || hovered

  return (
    <>
      {/* Mobile sidebar */}
      <div className="sm:hidden">
        <Sheet
          open={mobileOpen}
          onOpenChange={setMobileOpen}
        >
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open navigation"
              className="absolute left-3 top-1 z-30 size-10 bg-background"
            >
              <Sidebar className="size-5 text-muted-foreground transition-colors hover:text-foreground" />
            </Button>
          </SheetTrigger>

          <SheetContent
            side="left"
            className={cn(
              "w-[min(85vw,264px)] max-w-none",
              "border-0 bg-primary p-0",
              "text-primary-foreground"
            )}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>
                Dashboard navigation
              </SheetTitle>

              <SheetDescription>
                Navigate between workspace pages.
              </SheetDescription>
            </SheetHeader>

            <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
              <SidebarDecorations />

              <div className="relative flex h-full min-h-0 flex-col">
                <SidebarBrand expanded />

                <SidebarNavigation
                  navigation={navigation}
                  expanded
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "group/sidebar fixed inset-y-0 left-0 z-40",
          "hidden flex-col overflow-hidden",
          "bg-primary text-primary-foreground",
          "shadow-xl shadow-primary/10",
          "transition-[width] duration-300 ease-in-out",
          "sm:flex",
          expanded ? "sm:w-[264px]" : "sm:w-[70px]",
          "xl:w-[264px]"
        )}
      >
        <SidebarDecorations />

        <div className="relative flex h-full min-h-0 flex-col">
          <SidebarBrand expanded={expanded} />

          <SidebarNavigation
            navigation={navigation}
            expanded={expanded}
          />

          <SidebarFooter
            expanded={expanded}
            pinned={pinned}
            onTogglePin={() =>
              setPinned((value) => !value)
            }
          />
        </div>
      </aside>
    </>
  )
}
