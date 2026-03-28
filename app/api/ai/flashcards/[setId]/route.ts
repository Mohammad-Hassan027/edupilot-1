export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getSavedFlashcardSetById } from "@/lib/database"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { setId } = await params
    const set = await getSavedFlashcardSetById(user.id, setId)

    if (!set) {
      return NextResponse.json({ error: "Flashcard set not found" }, { status: 404 })
    }

    return NextResponse.json({ set })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load flashcard set"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}