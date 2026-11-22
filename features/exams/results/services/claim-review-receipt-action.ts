"use server"

import { redirect } from "next/navigation"

import { issueReviewReceipt } from "./review-receipt"

export async function claimReviewReceiptAction(code: string, attemptId: string) {
  const normalized = code.trim().toUpperCase()
  // Validation + ownership of the attempt are checked inside the ticket RPC.
  const issued = await issueReviewReceipt(normalized, attemptId)
  if (issued) {
    redirect(`/take/${normalized}/attempt/${attemptId}/complete`)
  }
  // No side effects if the old exam login expired or policy disallows results.
  redirect(`/take/${normalized}/attempt/${attemptId}/complete?receipt=unavailable`)
}
