
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Search,
  School,
  UserPlus,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type {
  EnrollmentWorkspaceData,
} from "../services/queries"

import { ClassRegister } from "./ClassRegister"
import {
  StudentPlacementPicker,
} from "./StudentPlacementPicker"

type Props = {
  data: EnrollmentWorkspaceData
}

export function EnrollmentWorkspace({
  data,
}: Props) {
  const router = useRouter()

  const [rosterQuery, setRosterQuery] =
    useState(data.rosterSearch)

  const selectedClass = data.classes.find(
    (item) => item.id === data.classId
  )

  function navigate(
    changes: Record<string, string>
  ) {
    const params = new URLSearchParams({
      session: data.sessionId,
      class: data.classId,

      sourceSession: data.sourceSessionId,
      sourceClass: data.sourceClassId,

      rosterSearch: data.rosterSearch,
      candidateSearch: data.candidateSearch,

      page: String(data.page),
      candidatePage: String(data.candidatePage),

      ...changes,
    })

    router.push(
      `/school/enrollment?${params.toString()}`
    )
  }

  const registerPages = Math.max(
    1,
    Math.ceil(data.rosterTotal / 20)
  )

  const candidatePages = Math.max(
    1,
    Math.ceil(data.candidatesTotal / 20)
  )

  return (
    <div className="space-y-5">
      {/* Page heading */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <School className="size-4 text-primary" />
            School Integration
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Students & Enrollment
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {data.schoolName}
          </p>
        </div>

        <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
          Academic Records
        </Badge>
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Classes",
            value: data.classes.length,
            icon: GraduationCap,
            style:
              "border-primary/20 bg-primary/5",
          },
          {
            label: "Class Register",
            value: data.rosterTotal,
            icon: Users,
            style:
              "border-emerald-500/20 bg-emerald-500/5",
          },
          {
            label: "Available Students",
            value: data.candidatesTotal,
            icon: UserPlus,
            style:
              "border-sky-500/20 bg-sky-500/5",
          },
        ].map((item) => {
          const Icon = item.icon

          return (
            <Card
              key={item.label}
              className={`flex flex-row items-center gap-3 p-4 shadow-none ${item.style}`}
            >
              <Icon className="size-6 text-primary" />

              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {item.value}
                </p>
                <p className="text-xs">
                  {item.label}
                </p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Destination selectors */}
      <Card className="gap-3 border-primary/20 bg-primary/5 p-4 shadow-none">
        <div>
          <p className="text-sm font-semibold">
            Destination Placement
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose where students will be enrolled.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>
              Academic Session
            </Label>

            <Select
              value={data.sessionId}
              onValueChange={(value) =>
                navigate({
                  session: value,
                  class: "",
                  rosterSearch: "",
                  candidateSearch: "",
                  page: "1",
                  candidatePage: "1",
                })
              }
            >
              <SelectTrigger className="w-full bg-background shadow-none">
                <SelectValue placeholder="Choose session" />
              </SelectTrigger>

              <SelectContent>
                {data.sessions.map((item) => (
                  <SelectItem
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                    {item.is_current
                      ? " · Current"
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Destination Class
            </Label>

            <Select
              value={data.classId}
              disabled={!data.classes.length}
              onValueChange={(value) =>
                navigate({
                  class: value,
                  rosterSearch: "",
                  page: "1",
                  candidatePage: "1",
                })
              }
            >
              <SelectTrigger className="w-full bg-background shadow-none">
                <SelectValue placeholder="Choose class" />
              </SelectTrigger>

              <SelectContent>
                {data.classes.map((item) => (
                  <SelectItem
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {data.error && (
        <div
          role="alert"
          className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm"
        >
          {data.error}
        </div>
      )}

      {!data.sessionId ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="font-semibold">
            No academic session configured
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete Academic Setup first.
          </p>
        </div>
      ) : !selectedClass ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="font-semibold">
            No classes for this session
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create classes in Academic Setup
            before enrolling students.
          </p>
        </div>
      ) : (
        <>
          {/* Independent register search */}
          <form
            onSubmit={(event) => {
              event.preventDefault()

              navigate({
                rosterSearch: rosterQuery.trim(),
                page: "1",
              })
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={rosterQuery}
                onChange={(event) =>
                  setRosterQuery(event.target.value)
                }
                placeholder={`Search ${selectedClass.name} register...`}
                className="pl-9 shadow-none"
              />
            </div>

            <Button
              type="submit"
              variant="outline"
              className="shadow-none"
            >
              Search Register
            </Button>

            {data.rosterSearch && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setRosterQuery("")

                  navigate({
                    rosterSearch: "",
                    page: "1",
                  })
                }}
              >
                Clear
              </Button>
            )}
          </form>

          {/* Class register and incoming students */}
          <div className="grid items-start gap-4 xl:grid-cols-2">
            <ClassRegister
              students={data.roster}
              total={data.rosterTotal}
              className={selectedClass.name}
            />

            <StudentPlacementPicker
              key={[
                data.sessionId,
                data.classId,
                data.sourceSessionId,
                data.sourceClassId,
                data.candidateSearch,
                data.candidatePage,
              ].join(":")}

              candidates={data.candidates}
              total={data.candidatesTotal}

              sessionId={data.sessionId}
              classId={data.classId}

              sessions={data.sessions}
              sourceClasses={data.sourceClasses}

              sourceSessionId={
                data.sourceSessionId
              }
              sourceClassId={
                data.sourceClassId
              }

              onSourceSessionChange={(value) =>
                navigate({
                  sourceSession: value,
                  sourceClass: "all",
                  candidateSearch: "",
                  candidatePage: "1",
                })
              }

              onSourceClassChange={(value) =>
                navigate({
                  sourceClass: value,
                  candidateSearch: "",
                  candidatePage: "1",
                })
              }

              search={data.candidateSearch}

              onSearch={(value) =>
                navigate({
                  candidateSearch: value,
                  candidatePage: "1",
                })
              }
            />
          </div>

          {/* Pagination */}
          <div className="grid gap-4 xl:grid-cols-2">
            {[
              {
                title: "Class Register",
                page: data.page,
                totalPages: registerPages,
                parameter: "page",
              },
              {
                title: "Available Students",
                page: data.candidatePage,
                totalPages: candidatePages,
                parameter: "candidatePage",
              },
            ].map((item) => (
              <div
                key={item.parameter}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div>
                  <p className="text-xs font-semibold">
                    {item.title}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Page {item.page} of{" "}
                    {item.totalPages}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={item.page <= 1}
                    className="shadow-none"
                    onClick={() =>
                      navigate({
                        [item.parameter]:
                          String(item.page - 1),
                      })
                    }
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      item.page >= item.totalPages
                    }
                    className="shadow-none"
                    onClick={() =>
                      navigate({
                        [item.parameter]:
                          String(item.page + 1),
                      })
                    }
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
