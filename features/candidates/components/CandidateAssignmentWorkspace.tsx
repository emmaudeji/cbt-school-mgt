import type { CandidateManagementData } from "@/types/candidate-management"
import { ExamAssignmentManager } from "./assignment/ExamAssignmentManager"

export function CandidateAssignmentWorkspace({ data }: { data: CandidateManagementData }) {
  return <ExamAssignmentManager data={data} />
}
