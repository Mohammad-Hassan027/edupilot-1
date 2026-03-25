export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Video generation is currently unavailable in EduPilot. Please use image generation or chat instead.",
      disabled: true,
    },
    { status: 410 }
  )
}
