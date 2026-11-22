
import type {
  AssessmentSetupData,
  AssessmentComponent,
} from "../services/assessment-queries"

export type OfferingReadinessStatus =
  | "ready"
  | "missing"
  | "review"

export type OfferingReadiness = {
  id: string
  classId: string
  className: string
  subjectName: string
  components: AssessmentComponent[]
  status: OfferingReadinessStatus
  reason: string
  totalMarks: number
  totalWeight: number
}

export type ClassReadiness = {
  id: string
  name: string
  offerings: OfferingReadiness[]
  ready: number
  missing: number
  review: number
  status: OfferingReadinessStatus
}

const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100

export function buildAcademicReadiness(
  data: AssessmentSetupData
): ClassReadiness[] {
  const subjectNames = new Map(
    data.subjects.map((s) => [s.id, s.name])
  )

  const componentsByOffering =
    new Map<string, AssessmentComponent[]>()

  for (const component of data.components) {
    const items =
      componentsByOffering.get(component.offering_id) ?? []

    items.push(component)
    componentsByOffering.set(component.offering_id, items)
  }

  const offeringsByClass = new Map<
    string,
    OfferingReadiness[]
  >()

  for (const offering of data.offerings) {
    const components =
      componentsByOffering.get(offering.id) ?? []

    const totalMarks = round(
      components.reduce(
        (sum, c) => sum + Number(c.maximum_score),
        0
      )
    )

    const totalWeight = round(
      components.reduce(
        (sum, c) => sum + Number(c.weight_percent),
        0
      )
    )

    let status: OfferingReadinessStatus = "ready"
    let reason = "Assessment structure configured"

    if (components.length === 0) {
      status = "missing"
      reason = "No assessment components"
    } else if (
      components.some(
        (c) =>
          !Number.isFinite(Number(c.maximum_score)) ||
          Number(c.maximum_score) <= 0 ||
          !Number.isFinite(Number(c.weight_percent)) ||
          Number(c.weight_percent) < 0
      )
    ) {
      status = "review"
      reason = "Invalid component marks or weights"
    } else if (Math.abs(totalWeight - 100) > 0.01) {
      status = "review"
      reason = `Weights total ${totalWeight}%, not 100%`
    }

    const record: OfferingReadiness = {
      id: offering.id,
      classId: offering.class_id,
      className: "",
      subjectName:
        subjectNames.get(offering.subject_id) ??
        "Unknown subject",
      components: [...components].sort(
        (a, b) => a.position - b.position
      ),
      status,
      reason,
      totalMarks,
      totalWeight,
    }

    const existing =
      offeringsByClass.get(offering.class_id) ?? []

    existing.push(record)
    offeringsByClass.set(offering.class_id, existing)
  }

  return [...data.classes]
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
      })
    )
    .map((schoolClass) => {
      const offerings = (
        offeringsByClass.get(schoolClass.id) ?? []
      )
        .map((offering) => ({
          ...offering,
          className: schoolClass.name,
        }))
        .sort((a, b) =>
          a.subjectName.localeCompare(b.subjectName)
        )

      const ready = offerings.filter(
        (o) => o.status === "ready"
      ).length

      const missing = offerings.filter(
        (o) => o.status === "missing"
      ).length

      const review = offerings.filter(
        (o) => o.status === "review"
      ).length

      const status: OfferingReadinessStatus =
        offerings.length === 0
          ? "missing"
          : missing > 0 || review > 0
            ? "review"
            : "ready"

      return {
        id: schoolClass.id,
        name: schoolClass.name,
        offerings,
        ready,
        missing,
        review,
        status,
      }
    })
}
