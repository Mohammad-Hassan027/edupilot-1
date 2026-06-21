export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getSavedFlashcardSetById, updateFlashcardReview, type FlashcardReviewRating } from "@/lib/database"

const VALID_RATINGS: FlashcardReviewRating[] = ["again", "hard", "good", "easy"]

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { setId } = await params
    const { cardIndex, rating } = await req.json()

    if (typeof cardIndex !== "number" || cardIndex < 0) {
      return NextResponse.json({ error: "cardIndex is required" }, { status: 400 })
    }

    if (!VALID_RATINGS.includes(rating)) {
      return NextResponse.json({ error: "rating must be one of: again, hard, good, easy" }, { status: 400 })
    }

    const updatedSet = await updateFlashcardReview(user.id, setId, cardIndex, rating)
    return NextResponse.json({ success: true, set: updatedSet })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update flashcard review"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}