export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 })

    const supabase = await getSupabaseServer()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })

    if (error) {
      // Don't reveal if user exists or not for security
      console.error("[forgot-password]", error.message)
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[forgot-password] Error:", err)
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 })
  }
}
