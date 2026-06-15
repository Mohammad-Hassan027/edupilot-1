export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin, getSupabaseServer } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  try {
    const { password, email } = await req.json()

    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }
    if (!email) {
      return NextResponse.json({ error: "Session expired. Please start over." }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const admin = await getSupabaseAdmin()

    // ── Confirm the OTP was verified (used=true record exists) ───────────────
    const { data: records } = await admin
      .from("password_reset_otps")
      .select("id, used")
      .eq("email", normalizedEmail)
      .eq("used", true)
      .order("created_at", { ascending: false })
      .limit(1)

    if (!records || records.length === 0) {
      return NextResponse.json(
        { error: "OTP not verified. Please complete the verification step first." },
        { status: 401 }
      )
    }

    // ── Find the user by email using admin ────────────────────────────────────
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const user = users?.find(u => u.email?.toLowerCase() === normalizedEmail)

    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 })
    }

    // ── Update password directly via admin (no session needed) ───────────────
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password,
    })

    if (updateError) {
      console.error("[reset-password] Update error:", updateError.message)
      return NextResponse.json(
        { error: "Failed to update password. Please try again." },
        { status: 500 }
      )
    }

    // ── Clean up all OTP records for this email ───────────────────────────────
    await admin.from("password_reset_otps").delete().eq("email", normalizedEmail)

    // ── Invalidate session locally ─────────────────────────────────────────────
    const supabase = await getSupabaseServer()
    await supabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[reset-password] Error:", err)
    return NextResponse.json({ error: "Password reset failed. Please try again." }, { status: 500 })
  }
}
