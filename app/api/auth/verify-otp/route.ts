export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  try {
    const { email, token } = await req.json()
    if (!email || !token) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 })
    }
    if (token.length !== 6) {
      return NextResponse.json({ error: "OTP must be 6 digits" }, { status: 400 })
    }

    const supabase = await getSupabaseServer()

    // Try "email" type first (used by signInWithOtp magic link as OTP)
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    })

    if (error) {
      // Fallback: try "magiclink" type
      const { error: error2 } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "magiclink",
      })
      if (error2) {
        return NextResponse.json(
          { error: "Invalid or expired OTP. Please request a new one." },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({ success: true, session: !!data?.session })
  } catch (err) {
    console.error("[verify-otp] Error:", err)
    return NextResponse.json({ error: "OTP verification failed" }, { status: 500 })
  }
}
