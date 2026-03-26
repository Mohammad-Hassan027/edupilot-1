export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getSavedNoteById } from "@/lib/database"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { noteId } = await params
    const note = await getSavedNoteById(user.id, noteId)

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    return NextResponse.json({ note })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load note"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
