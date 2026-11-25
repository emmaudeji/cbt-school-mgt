
"use client"

import { useMemo, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
} from "lucide-react"
import { SchoolAssessmentSetupComponent } from "../services/action"
import CustomSelect from "@/components/shared/CustomSelect"


type Offering = {
  id: string
  class_id: string
}

type SchoolClass = {
  id: string
  name: string
}

type Selection = {
  offeringId: string
  componentId: string | null
}

type Props = {
  selectedOfferingIds: string[]
  offerings: Offering[]
  classes: SchoolClass[]
  components: SchoolAssessmentSetupComponent[]
  disabled?: boolean
}

export function SchoolExamAssessmentSetup({
  selectedOfferingIds,
  offerings,
  classes,
  components,
  disabled = false,
}: Props) {
  // Only explicitly changed selections are stored in state.
  // Automatic defaults are derived from the selected offerings.
  const [overrides, setOverrides] = useState<
    Record<string, string>
  >({})

  const classNames = useMemo(
    () => new Map(classes.map(item => [
      item.id,
      item.name,
    ])),
    [classes]
  )

  const offeringById = useMemo(
    () => new Map(offerings.map(item => [
      item.id,
      item,
    ])),
    [offerings]
  )

  const componentsByOffering = useMemo(() => {
    const grouped = new Map<
      string,
      SchoolAssessmentSetupComponent[]
    >()

    for (const component of components) {
      const existing = grouped.get(component.offering_id) ?? []
      existing.push(component)
      grouped.set(component.offering_id, existing)
    }

    return grouped
  }, [components])

  // Prefer a shared "1ST CA" when every selected offering
  // has exactly one component with that name.
  //
  // Otherwise prefer the first common component name
  // across all selected offerings.
  const suggestedName = useMemo(() => {
    if (selectedOfferingIds.length === 0) return null

    const first =
      componentsByOffering.get(selectedOfferingIds[0]) ?? []

    const shared = first.filter(component =>
      selectedOfferingIds.every(offeringId => {
        const matches = (
          componentsByOffering.get(offeringId) ?? []
        ).filter(item =>
          item.name.trim().toLowerCase() ===
          component.name.trim().toLowerCase()
        )

        return matches.length === 1
      })
    )

    const preferred = shared.find(
      item => item.name.trim().toLowerCase() === "1st ca"
    )

    return preferred?.name ?? shared[0]?.name ?? null
  }, [selectedOfferingIds, componentsByOffering])

  const selections: Selection[] = selectedOfferingIds.map(
    offeringId => {
      const available =
        componentsByOffering.get(offeringId) ?? []

      const automatic = suggestedName
        ? available.find(
            item =>
              item.name.trim().toLowerCase() ===
              suggestedName.trim().toLowerCase()
          )?.id ?? null
        : null

      const overridden = overrides[offeringId]

      // An explicit "none" means do not link this offering.
      const componentId =
        overridden === "none"
          ? null
          : overridden &&
              available.some(item => item.id === overridden)
            ? overridden
            : automatic

      return { offeringId, componentId }
    }
  )

  const configured = selections.filter(
    item => item.componentId !== null
  ).length

  if (selectedOfferingIds.length === 0) {
    return null
  }

  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white">
          <ClipboardCheck className="size-4" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold sm:text-base">
            School Assessment Setup
          </h2>
          <p className="mt-0.5 text-xs text-foreground/75">
            Choose where examination results will be
            imported after grading.
          </p>
        </div>

        <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
          {configured}/{selectedOfferingIds.length} ready
        </span>
      </div>

      <div className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.035] p-3 sm:p-4">
        {suggestedName && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />

            <p className="text-xs leading-5 text-foreground/80">
              <strong>{suggestedName}</strong> is available
              across the selected class arms and has been
              suggested automatically.
            </p>
          </div>
        )}

        {/* Each offering owns its own assessment component. */}
        <div className="grid gap-3 sm:grid-cols-2">
          {selections.map(selection => {
            const offering = offeringById.get(
              selection.offeringId
            )

            const available =
              componentsByOffering.get(
                selection.offeringId
              ) ?? []

            const current = available.find(
              item => item.id === selection.componentId
            )

            return (
              <div
                key={selection.offeringId}
                className="space-y-2 rounded-lg border bg-background p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <GraduationCap className="size-4 text-blue-600" />
                    {offering
                      ? classNames.get(offering.class_id) ??
                        "Class"
                      : "Class"}
                  </p>

                  {current ? (
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="size-4 text-amber-600" />
                  )}
                </div>

                <CustomSelect
                    label="Assessment Component"
                    labelStyle="text-sm pb-1"
                    name={`assessment-${selection.offeringId}`}
                    value={selection.componentId ?? "none"}
                    onChange={(value) =>
                        setOverrides((previous) => ({
                        ...previous,
                        [selection.offeringId]: value,
                        }))
                    }
                    disabled={disabled || available.length === 0}
                    options={[
                        {
                        label: "No assessment selected",
                        value: "none",
                        },
                        ...available.map((component) => ({
                        label: `${component.name} · ${component.maximum_score} marks`,
                        value: component.id,
                        })),
                    ]}
                />

                {current ? (
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    {current.maximum_score} maximum marks
                    {" · "}
                    {current.weight_percent}% weight
                  </p>
                ) : (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {available.length === 0
                      ? "No assessment components configured for this offering."
                      : "No assessment destination selected."}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {configured < selections.length && (
          <p className="text-xs leading-5 text-amber-800 dark:text-amber-300">
            Some class arms have no assessment destination.
            You may still save the examination draft,
            but those arms will require assessment setup
            before school results can be imported.
          </p>
        )}

        <p className=" text-xs leading-5 text-foreground/70">
          These choices configure future school assessment
          integration. Examination grading and student
          eligibility remain independent.
        </p>
      </div>

      {/* Submit exact offering-to-component mapping to the
          existing examination creation action. */}
      <input
        type="hidden"
        name="school_assessment_selections"
        value={JSON.stringify(selections)}
      />
    </section>
  )
}
