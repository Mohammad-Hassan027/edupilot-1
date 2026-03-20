export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { generateAIResponse } from "@/lib/ai"
import { consumeCredit } from "@/lib/credits"
import { logUsage } from "@/lib/database"
import { cookies } from "next/headers"

const GUEST_COOKIE = "edupilot_guest_questions"
const GUEST_LIMIT = 1

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: "Message too long (max 2000 characters)" }, { status: 400 })
    }

    const user = await getUser()

    // ── Guest flow ──────────────────────────────────────────────────────────
    if (!user) {
      const cookieStore = cookies()
      const guestCookie = cookieStore.get(GUEST_COOKIE)
      const questionsUsed = parseInt(guestCookie?.value ?? "0", 10)

      if (questionsUsed >= GUEST_LIMIT) {
        return NextResponse.json(
          {
            error: "Login to continue using AI Tutor.",
            code: "GUEST_LIMIT_REACHED",
            requiresLogin: true,
          },
          { status: 403 }
        )
      }

      const aiResponse = await generateAIResponse(message.trim())

      const response = NextResponse.json({
        success: true,
        reply: aiResponse,
        guestQuestionsUsed: questionsUsed + 1,
        guestQuestionsRemaining: GUEST_LIMIT - questionsUsed - 1,
        isGuest: true,
      })

      // Increment guest counter via cookie
      response.cookies.set(GUEST_COOKIE, String(questionsUsed + 1), {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      })

      return response
    }

    // ── Authenticated user flow ──────────────────────────────────────────────
    const creditResult = await consumeCredit(user.id, "ai_chat")

    if (!creditResult.allowed) {
      return NextResponse.json(
        {
          error: "You have used your free AI credits. Activate your 14-day trial to continue.",
          code: "NO_CREDITS",
          requiresUpgrade: true,
        },
        { status: 402 }
      )
    }

    const aiResponse = await generateAIResponse(message.trim())

    // Log usage (non-blocking)
    logUsage(user.id, "ai_chat", "question_asked", {
      messageLength: message.length,
      creditsRemaining: creditResult.remaining,
    }).catch(console.error)

    return NextResponse.json({
      success: true,
      reply: aiResponse,
      creditsRemaining: creditResult.remaining,
      isTrial: creditResult.reason === "trial_active",
      isGuest: false,
    })
  } catch (err) {
    console.error("[ai/chat] Error:", err)
    return NextResponse.json({ error: "AI service unavailable. Please try again." }, { status: 500 })
  }
}
