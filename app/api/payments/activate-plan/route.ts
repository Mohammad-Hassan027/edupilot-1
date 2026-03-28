export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Direct plan activation is disabled. Complete payment verification first.",
    },
    { status: 400 }
  )
}
