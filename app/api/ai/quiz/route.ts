export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { generateQuiz } from "@/lib/ai"
import { consumeCredit } from "@/lib/credits"
import { logUsage } from "@/lib/database"

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

    const creditResult = await consumeCredit(user.id, "ai_chat")

    if (!creditResult.allowed) {
      return NextResponse.json(
        {
          error: "You have used your free credits. Activate your 14-day trial.",
          code: "NO_CREDITS",
          requiresUpgrade: true,
        },
        { status: 402 }
      )
    }

    const questions = await generateQuiz(topic.trim(), Math.min(Number(count) || 5, 10))

    logUsage(user.id, "quiz", "quiz_generated", {
      topic,
      count: questions.length,
      creditsRemaining: creditResult.remaining,
    }).catch(console.error)

    return NextResponse.json({
      success: true,
      questions,
      creditsRemaining: creditResult.remaining,
    })
  } catch (err) {
    console.error("[ai/quiz] Error:", err)
    const message = err instanceof Error ? err.message : "Failed to generate quiz"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
