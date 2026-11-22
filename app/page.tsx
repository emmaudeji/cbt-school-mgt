
"use client"

import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  HelpCircle,
  ShieldCheck,
} from "lucide-react"

import { SignInForm } from "@/components/auth/SignInForm"
import { useSchoolBranding } from "@/store/branding-store"

const features = [
  {
    icon: ClipboardCheck,
    title: "Online examinations",
    description: "Take and manage school tests with ease.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: CheckCircle2,
    title: "Quick results",
    description: "Get accurate, automatically graded results.",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: BookOpen,
    title: "Academic progress",
    description: "Keep school records organized in one place.",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
]

function FeatureCard({
  feature,
  compact = false,
}: {
  feature: (typeof features)[number]
  compact?: boolean
}) {
  const Icon = feature.icon

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-border/60 bg-card/70 p-3 sm:p-4"
          : "space-y-3"
      }
    >
      <div
        className={`flex shrink-0 items-center justify-center rounded-xl ${
          compact ? "mb-3 size-9" : "size-11"
        } ${feature.color}`}
      >
        <Icon className={compact ? "size-4" : "size-5"} />
      </div>

      <h3 className="text-xs font-semibold text-foreground sm:text-sm">
        {feature.title}
      </h3>

      <p
        className={
          compact
            ? "mt-1.5 hidden text-xs leading-5 text-muted-foreground sm:block"
            : "text-xs leading-5 text-muted-foreground"
        }
      >
        {feature.description}
      </p>
    </div>
  )
}

export default function HomePage() {
  const branding = useSchoolBranding()

  const schoolName = branding.name
  const schoolMotto = branding.motto ?? "Learning, testing and excellence"

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-background text-foreground">
      {/* Subtle background accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -right-32 top-24 size-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -left-32 bottom-24 size-80 rounded-full bg-accent/30 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-dvh max-w-7xl flex-col px-4 sm:px-8 lg:px-12">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 py-4 sm:py-6">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2.5 sm:gap-3"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm sm:size-11 sm:rounded-2xl">
              <GraduationCap className="size-5 sm:size-6" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight tracking-tight text-foreground sm:text-base">
                {schoolName}
              </p>

              <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">
                Examination Portal
              </p>
            </div>
          </Link>

          <Link
            href="/help"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary sm:border-0 sm:px-0 sm:text-sm"
          >
            <HelpCircle className="size-3.5 sm:hidden" />
            <span>Help</span>
          </Link>
        </header>

        {/* Main content */}
        <div className="grid flex-1 items-center gap-8 pb-8 pt-4 sm:gap-12 sm:py-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:py-16">
          {/* Hero */}
          <section className="order-1 lg:order-none">
            <div className="max-w-xl">
              {/* Mobile welcome */}
              <div className="lg:hidden">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1.5 text-[11px] font-semibold text-primary">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Your school learning portal
                </div>

                <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight sm:text-4xl">
                  Ready to{" "}
                  <span className="text-primary">excel?</span>
                </h1>

                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Sign in to access your examinations, results,
                  and academic records.
                </p>
              </div>

              {/* Desktop welcome */}
              <div className="hidden lg:block">
                <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-xs font-semibold text-primary">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  School examination and learning portal
                </div>

                <h1 className="text-5xl font-bold leading-[1.13] tracking-tight xl:text-6xl">
                  A smarter way to{" "}
                  <span className="text-primary">learn,</span>{" "}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    test
                  </span>{" "}
                  and{" "}
                  <span className="text-[var(--brand-accent)]">
                    excel.
                  </span>
                </h1>

                <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
                  Welcome to {schoolName}. One simple place for
                  examinations, results, and academic progress.
                </p>

                <Link
                  href="/instructions"
                  className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:opacity-80"
                >
                  Read examination instructions
                  <ArrowRight className="size-4" />
                </Link>
              </div>

              {/* Desktop features */}
              <div className="mt-12 hidden grid-cols-3 gap-5 lg:grid">
                {features.map((feature) => (
                  <FeatureCard
                    key={feature.title}
                    feature={feature}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Sign-in */}
          <section className="relative order-2 mx-auto w-full max-w-md lg:order-none lg:max-w-none">
            {/* Decorative accents */}
            <div
              aria-hidden="true"
              className="absolute -right-4 -top-4 hidden size-24 rounded-3xl bg-[var(--brand-accent)]/20 sm:block"
            />

            <div
              aria-hidden="true"
              className="absolute -bottom-5 -left-5 hidden size-28 rounded-full bg-primary/10 sm:block"
            />

            <div className="relative rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm shadow-primary/5 sm:rounded-3xl sm:p-9 sm:shadow-xl lg:p-10">
              <SignInForm />
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground sm:mt-5">
              <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
              Secure access for students and staff
            </div>
          </section>

          {/* Mobile features */}
          <section className="order-3 lg:hidden">
            <Link
              href="/instructions"
              className="flex min-h-12 items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              <span>Examination instructions</span>
              <ArrowRight className="size-4" />
            </Link>

            <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-4">
              {features.map((feature) => (
                <FeatureCard
                  key={feature.title}
                  feature={feature}
                  compact
                />
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="flex flex-col items-center justify-between gap-2 border-t border-border/70 py-5 text-center text-xs text-muted-foreground sm:flex-row">
          <span>
            © {new Date().getFullYear()} {schoolName}.
          </span>

          <span>{schoolMotto}</span>
        </footer>
      </div>
    </main>
  )
}
