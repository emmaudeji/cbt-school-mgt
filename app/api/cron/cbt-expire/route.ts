
import { timingSafeEqual } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { getPublicExamClient } from "@/features/exams/public/services/public-exam-client"


export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  const given = request.headers.get("authorization")

  if (!expected || !given?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const actualBuffer = Buffer.from(given.slice(7), "utf8")
  const expectedBuffer = Buffer.from(expected, "utf8")

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const { data, error } = await getPublicExamClient().rpc(
    "cbt_expire_due_attempts",
    { p_batch_size: 100 }
  )

  if (error) {
    console.error("[CBT:EXPIRY_JOB]", error)

    return NextResponse.json(
      { error: "Expiry job failed" },
      { status: 500 }
    )
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  })
}
