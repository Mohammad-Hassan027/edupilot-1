export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getDueFlashcards } from "@/lib/database"

export async function GET() {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ cards: [] })
    }

    const cards = await getDueFlashcards(user.id)
    return NextResponse.json({ cards })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load due flashcards"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
