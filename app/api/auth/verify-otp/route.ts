export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  try {
    const { email, token } = await req.json()
    if (!email || !token) return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 })

    const supabase = await getSupabaseServer()
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    })

    if (error) {
      return NextResponse.json({ error: "Invalid or expired OTP. Please request a new one." }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[verify-otp] Error:", err)
    return NextResponse.json({ error: "OTP verification failed" }, { status: 500 })
  }
}
