"use client"
import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Home,
  SearchX,
} from "lucide-react"

import { useSchoolBranding } from "@/store/branding-store"
import { LinkButton } from "@/components/shared/LinkButton"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  const branding = useSchoolBranding()
  const router = useRouter()

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.replace("/")
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-background text-foreground">
      {/* Background decorations */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -right-32 -top-32 size-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 size-96 rounded-full bg-accent/30 blur-3xl" />
      </div>

      {/* School branding */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center px-5 py-6 sm:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="size-6" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground sm:text-base">
              {branding.name}
            </p>

            <p className="text-xs text-muted-foreground">
              School Portal
            </p>
          </div>
        </Link>
      </header>

      {/* Main 404 content */}
      <section className="relative z-10 flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-xl text-center">
          {/* Illustration */}
          <div className="relative mx-auto mb-8 flex h-52 max-w-sm items-center justify-center sm:h-64">
            <div className="absolute size-52 rounded-full border border-primary/10 bg-primary/5 sm:size-60" />

            <div className="absolute size-36 rounded-full border border-primary/10 bg-background/60 sm:size-44" />

            <span className="relative select-none text-[105px] font-black leading-none tracking-tighter text-primary sm:text-[140px]">
              404
            </span>

            <div className="absolute -right-1 top-5 flex size-12 rotate-12 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-md sm:right-0">
              <SearchX className="size-6" />
            </div>

            <div className="absolute -bottom-1 left-2 flex size-12 -rotate-12 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-md sm:left-4">
              <BookOpen className="size-6" />
            </div>
          </div>

          <div className="mb-5 inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
            Page not found
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            Oops! This page is missing.
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
            We {"couldn't"} find the page {"you're"} looking for.
            It may have been moved, renamed, or the link
            might be incorrect.
          </p>

          {/* Actions */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              onClick={()=>handleGoBack()}
              size="lg"
              className="h-11 w-full gap-2 rounded-xl px-6 sm:w-auto"
            >
                <ArrowLeft className="size-4" />
                Go back
            </Button>

            <LinkButton
              href="/help"
              variant="outline"
              size="lg"
              className="h-11 w-full gap-2 rounded-xl px-6 sm:w-auto"
            >
                <ArrowLeft className="size-4" />
                Visit help center
            </LinkButton>
          </div>

          <p className="mt-8 text-xs text-muted-foreground">
            Need assistance? Contact your school administrator.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/60 px-5 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {branding.name}.
        All rights reserved.
      </footer>
    </main>
  )
}
