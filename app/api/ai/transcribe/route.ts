export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { requireAiAccess } from "@/lib/ai-guard"

const GROQ_TRANSCRIPTION_URL = "https://api.groq.com/openai/v1/audio/transcriptions"

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAiAccess()
    if (guard.error) return guard.error

    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY is not configured." }, { status: 500 })
    }

    const formData = await req.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Audio file is required." }, { status: 400 })
    }

    const upstreamFormData = new FormData()
    upstreamFormData.append("file", file, file.name || "voice-question.webm")
    upstreamFormData.append("model", "whisper-large-v3-turbo")
    upstreamFormData.append("response_format", "json")
    upstreamFormData.append("temperature", "0")

    const response = await fetch(GROQ_TRANSCRIPTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: upstreamFormData,
    })

    const responseText = await response.text()
    let data: { text?: string; error?: { message?: string } } = {}

    try {
      data = responseText ? JSON.parse(responseText) : {}
    } catch {
      data = {}
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.error?.message || responseText || "Failed to transcribe audio.",
        },
        { status: response.status }
      )
    }

    const text = typeof data.text === "string" ? data.text.trim() : ""

    if (!text) {
      return NextResponse.json({ error: "No speech was detected in the recording." }, { status: 422 })
    }

    return NextResponse.json({
      success: true,
      text,
    })
  } catch (error) {
    console.error("[ai/transcribe] Error:", error)
    const message = error instanceof Error ? error.message : "Failed to transcribe audio"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
