export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { generateFlashcards } from "@/lib/ai"
import {
  logUsage,
  getSubscription,
  isTrialActive,
  getSavedFlashcardSets,
  saveFlashcardSet,
} from "@/lib/database"

export async function GET() {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ sets: [] })
    }

    const sets = await getSavedFlashcardSets(user.id, 12)
    return NextResponse.json({ sets })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load flashcard history"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Login required to generate flashcards.", code: "UNAUTHORIZED", requiresLogin: true },
        { status: 401 }
      )
    }

    const { topic, count = 10 } = await req.json()

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
    }

    const subscription = await getSubscription(user.id)
    const paidTrialActive = await isTrialActive(user.id)
    const hasPaidPlan = subscription?.plan_id === "pro" || subscription?.plan_id === "premium"
    const canUseFlashcards = Boolean(
      hasPaidPlan && (paidTrialActive || subscription?.status === "active" || subscription?.status === "trial")
    )

    if (!canUseFlashcards) {
      return NextResponse.json(
        {
          error: "Flashcards is available on Pro and Premium plans only. Start your 14-day free trial to continue.",
          code: "PLAN_REQUIRED",
          requiresUpgrade: true,
        },
        { status: 402 }
      )
    }

    const normalizedTopic = topic.trim()
    const totalCards = Math.min(Number(count) || 10, 20)
    const flashcards = await generateFlashcards(normalizedTopic, totalCards)

    const savedSet = await saveFlashcardSet(user.id, {
      topic: normalizedTopic,
      cards: flashcards.map((card) => ({
        front: card.front,
        back: card.back,
      })),
    })

    await logUsage(user.id, "flashcards", "flashcards_generated", {
      topic: normalizedTopic,
      count: flashcards.length,
      planId: subscription?.plan_id,
      firstCardFront: flashcards[0]?.front || null,
      lastCardFront: flashcards[flashcards.length - 1]?.front || null,
      lastGeneratedAt: new Date().toISOString(),
      savedSetId: savedSet.id,
    }).catch(console.error)

    return NextResponse.json({ success: true, flashcards, savedSet })
  } catch (err) {
    console.error("[ai/flashcards] Error:", err)
    const message = err instanceof Error ? err.message : "Failed to generate flashcards"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}