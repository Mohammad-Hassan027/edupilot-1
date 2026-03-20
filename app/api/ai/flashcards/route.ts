export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { generateFlashcards } from "@/lib/ai"
import { consumeCredit } from "@/lib/credits"
import { logUsage } from "@/lib/database"

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Login required to generate flashcards.", code: "UNAUTHORIZED", requiresLogin: true }, { status: 401 })
    }

    const { topic, count = 5 } = await req.json()

    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
    }

    const creditResult = await consumeCredit(user.id, "flashcards")

    if (!creditResult.allowed) {
      return NextResponse.json(
        {
          error: "You have used your free flashcard credits. Activate your 14-day trial.",
          code: "NO_CREDITS",
          requiresUpgrade: true,
        },
        { status: 402 }
      )
    }

    const flashcards = await generateFlashcards(topic.trim(), Math.min(count, 10))

    logUsage(user.id, "flashcards", "flashcards_generated", {
      topic,
      count: flashcards.length,
      creditsRemaining: creditResult.remaining,
    }).catch(console.error)

    return NextResponse.json({
      success: true,
      flashcards,
      creditsRemaining: creditResult.remaining,
    })
  } catch (err) {
    console.error("[ai/flashcards] Error:", err)
    return NextResponse.json({ error: "AI service unavailable. Please try again." }, { status: 500 })
  }
}
