export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { generateEduPilotGuideResponse } from "@/lib/ai"

const FALLBACK_SUGGESTIONS = [
  "How do I use AI Tutor?",
  "How do I create notes?",
  "How does Quiz work?",
  "How do I use Planner?",
]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const message = typeof body?.message === "string" ? body.message.trim() : ""

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    if (message.length > 1000) {
      return NextResponse.json({ error: "Message is too long" }, { status: 400 })
    }

    const reply = await generateEduPilotGuideResponse(message)

    return NextResponse.json({
      success: true,
      reply,
      suggestions: FALLBACK_SUGGESTIONS,
    })
  } catch (err) {
    console.error("[edupilot-assistant] Error:", err)

    return NextResponse.json({
      success: true,
      reply:
        "I can help only with EduPilot usage. You can ask things like: How do I use AI Tutor, how to create notes, how quiz works, or how to use Planner.",
      suggestions: FALLBACK_SUGGESTIONS,
    })
  }
}