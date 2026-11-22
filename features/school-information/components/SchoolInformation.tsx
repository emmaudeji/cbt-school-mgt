
"use client"

import {
  School,
  MapPin,
  Phone,
  Mail,
  Globe,
  CalendarDays,
  Building2,
  GraduationCap,
  Hash,
  MapPinned,
  Contact,
  type LucideIcon,
} from "lucide-react"
import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import type { SchoolProp } from "@/types/school"
import { SchoolFormDrawer } from "./SchoolForm"

type Props = {
  school: SchoolProp
}

export default function SchoolInformation({ school }: Props) {
  return (
    <div className="space-y-6">
      {/* School hero */}
      <div className="relative overflow-hidden rounded-2xl bg-primary from-primary via-primary/50 to-violet-600 p-5 text-white sm:p-8">
        {/* Decorative shapes */}
        <div className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-24 size-48 rounded-full bg-pink-400/20" />
        <div className="pointer-events-none absolute right-12 top-12 size-16 rounded-full border border-white/20" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items- ">
          {/* Logo */}
          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/40 bg-white p-3 shadow-xl shadow-indigo-950/20 sm:size-32">
            {school.logo_path ? (
              <Image
                src={school.logo_path}
                alt={`${school.name} logo`}
                width={128}
                height={128}
                unoptimized
                className="size-full object-contain"
              />
            ) : (
              <School className="size-14 text-primary" />
            )}
          </div>

          {/* School identity */}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/20 bg-white/20 text-white hover:bg-white/20">
                <GraduationCap className="mr-1 size-3.5" />
                {school.school_level || "School"}
              </Badge>

              <Badge
                className={
                  school.status === "active"
                    ? "border-emerald-300/40 bg-emerald-400/20 text-emerald-50 hover:bg-emerald-400/20"
                    : "border-white/20 bg-white/15 text-white hover:bg-white/15"
                }
              >
                <span className="mr-1.5 size-1.5 rounded-full bg-current" />
                {school.status}
              </Badge>
            </div>

            <h1 className="text-2xl text-primary-foreground font-bold tracking-tight sm:text-3xl lg:text-4xl">
              {school.name}
            </h1>

            {school.motto && (
              <p className="text-sm italic text-blue-100 sm:text-base">
                {school.motto}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-blue-100 sm:text-sm">
              {school.code && (
                <span className="flex items-center gap-1.5">
                  <Hash className="size-3.5" />
                  {school.code}
                </span>
              )}

              {school.institution_type && (
                <span className="flex items-center gap-1.5 capitalize">
                  <Building2 className="size-3.5" />
                  {school.institution_type} Institution
                </span>
              )}

              {school.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {[school.city, school.state].filter(Boolean).join(", ")}
                </span>
              )}
            </div>
          </div>

          <SchoolFormDrawer school={school} />
        </div>
      </div>

      {/* School details */}
      <div className="divide-y divide-border">
        <Section
          title="General Information"
          description="Basic details about the institution"
          icon={Building2}
          color="text-blue-600"
          background="bg-blue-50 dark:bg-blue-500/10"
        >
          <Detail label="School Name" value={school.name} />
          <Detail label="School Code" value={school.code} />
          <Detail label="Short Name" value={school.short_name} />
          <Detail label="School Level" value={school.school_level} capitalize />
          <Detail label="Institution Type" value={school.institution_type} capitalize />
          <Detail
            label="Date Opened"
            value={
              school.opened_on
                ? new Intl.DateTimeFormat("en-NG", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(new Date(`${school.opened_on}T00:00:00Z`))
                : null
            }
            icon={CalendarDays}
          />
        </Section>

        <Section
          title="Location & Address"
          description="Where the school is located"
          icon={MapPinned}
          color="text-emerald-600"
          background="bg-emerald-50 dark:bg-emerald-500/10"
        >
          <Detail label="Address" value={school.address} />
          <Detail label="Address Line 2" value={school.address_line_2} />
          <Detail label="City" value={school.city} />
          <Detail label="District" value={school.district} />
          <Detail label="State" value={school.state} />
          <Detail label="Country" value={school.country} />
          <Detail label="Postal Code" value={school.postal_code} />
        </Section>

        <Section
          title="Contact Information"
          description="How to get in touch with the school"
          icon={Contact}
          color="text-violet-600"
          background="bg-violet-50 dark:bg-violet-500/10"
        >
          <Detail label="Phone Number" value={school.phone} icon={Phone} />
          <Detail label="Email Address" value={school.email} icon={Mail} />
          <Detail label="Website" value={school.website} icon={Globe} />
        </Section>
      </div>
    </div>
  )
}

function Section({
  title,
  description,
  icon: Icon,
  color,
  background,
  children,
}: {
  title: string
  description: string
  icon: LucideIcon
  color: string
  background: string
  children: React.ReactNode
}) {
  return (
    <section className="py-7 first:pt-1">
      <div className="mb-5 flex items-center gap-3">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${background}`}>
          <Icon className={`size-5 ${color}`} />
        </div>

        <div>
          <h2 className="text-base font-semibold text-foreground sm:text-lg">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {description}
          </p>
        </div>
      </div>

      <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  )
}

function Detail({
  label,
  value,
  icon: Icon,
  capitalize = false,
}: {
  label: string
  value?: string | null
  icon?: LucideIcon
  capitalize?: boolean
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>

      <div className="flex items-start gap-2">
        {Icon && (
          <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
        )}

        <p
          className={`break-words text-sm font-medium text-foreground ${
            capitalize ? "capitalize" : ""
          }`}
        >
          {value || (
            <span className="font-normal italic text-muted-foreground">
              Not provided
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
