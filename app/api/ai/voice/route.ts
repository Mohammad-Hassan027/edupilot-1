export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { generateAIResponse } from "@/lib/ai"
import {
  getSubscription,
  isTrialActive,
  logUsage,
  getSavedVoiceHistory,
  saveVoiceHistory,
} from "@/lib/database"

function buildTitle(prompt: string) {
  const cleaned = prompt.replace(/\s+/g, " ").trim()
  if (!cleaned) return "Voice Prompt"
  return cleaned.length > 60 ? `${cleaned.slice(0, 60)}...` : cleaned
}

function cleanForSpeech(text: string) {
  return text
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export async function GET() {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ history: [] })
    }

    const history = await getSavedVoiceHistory(user.id, 12)
    return NextResponse.json({ history })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load voice history"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Login required to use AI Voice.", code: "UNAUTHORIZED", requiresLogin: true },
        { status: 401 }
      )
    }

    const { prompt } = await req.json()

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const subscription = await getSubscription(user.id)
    const paidTrialActive = await isTrialActive(user.id)
    const hasPaidPlan = subscription?.plan_id === "pro" || subscription?.plan_id === "premium"
    const canUseVoice = Boolean(
      hasPaidPlan && (paidTrialActive || subscription?.status === "active" || subscription?.status === "trial")
    )

    if (!canUseVoice) {
      return NextResponse.json(
        {
          error: "AI Voice is available on Pro and Premium plans only.",
          code: "PLAN_REQUIRED",
          requiresUpgrade: true,
        },
        { status: 402 }
      )
    }

    const cleanPrompt = prompt.trim()

    const reply = await generateAIResponse(
      `Create clean, professional, student-friendly short notes for this voice query.

User query: "${cleanPrompt}"

Rules:
- Give a clean production-style answer
- Do not use markdown fences
- Do not use symbols like ## or ###
- Keep the structure neat and readable
- Use short headings written naturally
- Use concise paragraphs and bullet points where useful
- Focus on clarity for students
- Keep the answer direct and polished`,
      { mode: "chat" }
    )

    const cleanedReply = cleanForSpeech(reply)

    const saved = await saveVoiceHistory(user.id, {
      prompt: cleanPrompt,
      title: buildTitle(cleanPrompt),
      response: cleanedReply,
    })

    await logUsage(user.id, "ai_voice", "voice_prompt_completed", {
      prompt: cleanPrompt,
      title: saved.title,
      historyId: saved.id,
    }).catch(() => undefined)

    return NextResponse.json({
      success: true,
      reply: cleanedReply,
      historyItem: saved,
    })
  } catch (err) {
    console.error("[ai/voice] Error:", err)
    const message = err instanceof Error ? err.message : "Failed to generate voice response"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}