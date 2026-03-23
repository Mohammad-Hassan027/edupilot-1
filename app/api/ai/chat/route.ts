export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { generateAIResponse } from "@/lib/ai"
import { logUsage } from "@/lib/database"

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: "Message too long (max 2000 characters)" }, { status: 400 })
    }

    // Call Gemini — no limits, works for both guests and logged-in users
    const aiResponse = await generateAIResponse(message.trim())

    // Log usage for authenticated users only (non-fatal)
    const user = await getUser()
    if (user) {
      logUsage(user.id, "ai_chat", "question_asked", {
        messageLength: message.length,
      }).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      reply:   aiResponse,
      isGuest: !user,
    })
  } catch (err) {
    console.error("[ai/chat] Error:", err)
    const msg = err instanceof Error ? err.message : "AI service unavailable"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
