export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import * as crypto from "crypto"

function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex")
}

export async function POST(req: NextRequest) {
  try {
    const { email, token } = await req.json()

    if (!email || !token) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 })
    }
    if (!/^\d{6}$/.test(token)) {
      return NextResponse.json({ error: "Code must be exactly 6 digits" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const admin = await getSupabaseAdmin()

    // ── Look up the OTP record ────────────────────────────────────────────────
    const { data: records, error: fetchError } = await admin
      .from("password_reset_otps")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)

    if (fetchError || !records || records.length === 0) {
      return NextResponse.json(
        { error: "No reset code found. Please request a new one." },
        { status: 400 }
      )
    }

    const record = records[0]

    // ── Check expiry ──────────────────────────────────────────────────────────
    if (new Date(record.expires_at) < new Date()) {
      await admin.from("password_reset_otps").delete().eq("id", record.id)
      return NextResponse.json(
        { error: "This code has expired. Please request a new one." },
        { status: 400 }
      )
    }

    // ── Verify hash ───────────────────────────────────────────────────────────
    const inputHash = hashOTP(token)
    if (inputHash !== record.otp_hash) {
      return NextResponse.json(
        { error: "Incorrect code. Please check your email and try again." },
        { status: 400 }
      )
    }

    // ── Mark OTP as used (don't delete yet — needed for reset-password step) ──
    await admin
      .from("password_reset_otps")
      .update({ used: true })
      .eq("id", record.id)

    return NextResponse.json({ success: true, email: normalizedEmail })
  } catch (err) {
    console.error("[verify-otp] Error:", err)
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 500 })
  }
}
