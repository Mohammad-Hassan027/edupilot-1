export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { deleteSavedVoiceHistory } from "@/lib/database"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ historyId: string }> }
) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { historyId } = await params
    await deleteSavedVoiceHistory(user.id, historyId)

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete voice history"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}