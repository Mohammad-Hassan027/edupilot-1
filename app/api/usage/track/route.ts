import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { logUsage } from "@/lib/database"
import type { FeatureKey } from "@/types"

const VALID_FEATURES: FeatureKey[] = ["ai_chat", "flashcards", "study_plan"]

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { feature, action, metadata } = await req.json()

  if (!feature || !VALID_FEATURES.includes(feature)) {
    return NextResponse.json({ error: "Invalid feature" }, { status: 400 })
  }

  if (!action || typeof action !== "string") {
    return NextResponse.json({ error: "Action is required" }, { status: 400 })
  }

  await logUsage(user.id, feature as FeatureKey, action, metadata)

  return NextResponse.json({ success: true })
}
