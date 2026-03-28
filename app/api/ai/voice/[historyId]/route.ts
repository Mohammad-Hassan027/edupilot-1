export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getSavedVoiceHistoryById } from "@/lib/database"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ historyId: string }> }
) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { historyId } = await params
    const item = await getSavedVoiceHistoryById(user.id, historyId)

    if (!item) {
      return NextResponse.json({ error: "Voice history not found" }, { status: 404 })
    }

    return NextResponse.json({ item })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load voice history"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}