import { NextResponse } from "next/server"

export async function GET() {
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
    headers: {
      "x-goog-api-key": process.env.GEMINI_API_KEY!,
    },
  })

  const data = await res.json()

  return NextResponse.json({
    ok: res.ok,
    status: res.status,
    data,
  })
}