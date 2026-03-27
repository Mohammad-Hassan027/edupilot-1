export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { generateFlashcards } from "@/lib/ai"
import { logUsage, getSubscription, isTrialActive } from "@/lib/database"

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

    const flashcards = await generateFlashcards(topic.trim(), Math.min(Number(count) || 10, 20))

    logUsage(user.id, "flashcards", "flashcards_generated", {
      topic,
      count: flashcards.length,
      planId: subscription?.plan_id,
    }).catch(console.error)

    return NextResponse.json({ success: true, flashcards })
  } catch (err) {
    console.error("[ai/flashcards] Error:", err)
    const message = err instanceof Error ? err.message : "Failed to generate flashcards"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
