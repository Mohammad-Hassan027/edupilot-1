export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { requireAiAccess } from "@/lib/ai-guard"
import { generateImageWithGemini } from "@/lib/ai-tools"

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAiAccess()
    if (guard.error) return guard.error

    const { prompt } = await req.json()

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Image prompt is required" }, { status: 400 })
    }

    const imageUrl = await generateImageWithGemini(prompt.trim())

    return NextResponse.json({ success: true, imageUrl })
  } catch (error) {
    console.error("[ai/image] Error:", error)
    const message = error instanceof Error ? error.message : "Failed to generate image"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
