export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const supabase = await getSupabaseServer()

    // User must be authenticated via OTP before reaching here
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      return NextResponse.json({ error: "Failed to update password. Please start over." }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[reset-password] Error:", err)
    return NextResponse.json({ error: "Password reset failed" }, { status: 500 })
  }
}
