import { NextResponse } from "next/server"

export async function GET() {
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY!,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: "Say hello from EduPilot AI" }],
            },
          ],
        }),
      }
    )

    const data = await res.json()

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    })
  }
}