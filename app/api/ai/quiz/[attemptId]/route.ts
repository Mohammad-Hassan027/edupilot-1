export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { deleteSavedQuizAttempt, getSavedQuizAttemptById } from "@/lib/database"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { attemptId } = await params
    const attempt = await getSavedQuizAttemptById(user.id, attemptId)

    if (!attempt) {
      return NextResponse.json({ error: "Quiz history not found" }, { status: 404 })
    }

    return NextResponse.json({ attempt })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load quiz history"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { attemptId } = await params
    await deleteSavedQuizAttempt(user.id, attemptId)

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete quiz history"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}