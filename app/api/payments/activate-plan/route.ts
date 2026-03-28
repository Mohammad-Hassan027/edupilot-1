export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Direct plan activation is disabled. Verify Razorpay payment first.",
    },
    { status: 400 }
  )
}
