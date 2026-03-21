export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 })

    const admin = await getSupabaseAdmin()

    // Check user exists first (using admin to avoid enumeration issues in logs)
    const { data: users } = await admin.auth.admin.listUsers()
    const userExists = users?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!userExists) {
      // Still return success to prevent email enumeration
      return NextResponse.json({ success: true })
    }

    // Use admin to generate and send OTP via email
    // We use signInWithOtp which sends a 6-digit code when email OTP is enabled in Supabase
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    })

    if (error) {
      console.error("[forgot-password] OTP error:", error.message)
      // Return success anyway to prevent enumeration
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[forgot-password] Error:", err)
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 })
  }
}
