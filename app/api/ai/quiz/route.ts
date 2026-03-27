export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { generateQuiz } from "@/lib/ai"
import { logUsage, getSubscription, isTrialActive } from "@/lib/database"

export async function POST(req: NextRequest) {
  try {
    const { topic, count = 5 } = await req.json()

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
    }

    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Login required to generate quizzes.", code: "UNAUTHORIZED", requiresLogin: true },
        { status: 401 }
      )
    }

    const subscription = await getSubscription(user.id)
    const paidTrialActive = await isTrialActive(user.id)
    const hasPremiumPlan = subscription?.plan_id === "premium"
    const canUseQuiz = Boolean(
      hasPremiumPlan && (paidTrialActive || subscription?.status === "active")
    )

    if (!canUseQuiz) {
      return NextResponse.json(
        {
          error: "Quiz is available on the Premium plan only. Upgrade to Premium to continue.",
          code: "PLAN_REQUIRED",
          requiresUpgrade: true,
        },
        { status: 402 }
      )
    }

    const questions = await generateQuiz(topic.trim(), Math.min(Number(count) || 5, 10))

    logUsage(user.id, "quiz", "quiz_generated", {
      topic,
      count: questions.length,
      planId: subscription?.plan_id,
    }).catch(console.error)

    return NextResponse.json({
      success: true,
      questions,
      planId: subscription?.plan_id,
    })
  } catch (err) {
    console.error("[ai/quiz] Error:", err)
    const message = err instanceof Error ? err.message : "Failed to generate quiz"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
