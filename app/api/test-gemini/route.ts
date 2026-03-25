import { NextResponse } from "next/server"

export async function GET() {
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY!,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: "Say hello from EduPilot AI in one short sentence." }],
            },
          ],
        }),
      }
    )

    const data = await res.json()

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}