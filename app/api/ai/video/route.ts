export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { buildPollinationsVideoUrl } from "@/lib/ai-tools"

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Video prompt is required" }, { status: 400 })
    }

    const videoUrl = buildPollinationsVideoUrl(prompt.trim())

    return NextResponse.json({ success: true, videoUrl })
  } catch (error) {
    console.error("[ai/video] Error:", error)
    return NextResponse.json({ error: "Failed to generate video" }, { status: 500 })
  }
}
