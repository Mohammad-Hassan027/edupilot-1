export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { buildPollinationsImageUrl } from "@/lib/ai-tools"

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Image prompt is required" }, { status: 400 })
    }

    const imageUrl = buildPollinationsImageUrl(prompt.trim())

    return NextResponse.json({ success: true, imageUrl })
  } catch (error) {
    console.error("[ai/image] Error:", error)
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 })
  }
}
