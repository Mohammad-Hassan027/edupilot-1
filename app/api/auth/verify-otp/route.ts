export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import * as crypto from "crypto"

function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex")
}

// Max wrong guesses allowed before the code is invalidated. This caps a
// brute-force attacker to a handful of tries per issued code, well short of the
// ~900k possible 6-digit values.
const MAX_FAILED_ATTEMPTS = 5

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

    // ── Reject if this code has already exhausted its attempt budget ──────────
    const failedAttempts = record.failed_attempts ?? 0
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      await admin.from("password_reset_otps").delete().eq("id", record.id)
      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new reset code." },
        { status: 429 }
      )
    }

    // ── Verify hash ───────────────────────────────────────────────────────────
    const inputHash = hashOTP(token)
    if (inputHash !== record.otp_hash) {
      const newFailedAttempts = failedAttempts + 1

      // Threshold reached — invalidate the code so it can't be brute-forced.
      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        await admin.from("password_reset_otps").delete().eq("id", record.id)
        return NextResponse.json(
          { error: "Too many incorrect attempts. Please request a new reset code." },
          { status: 429 }
        )
      }

      await admin
        .from("password_reset_otps")
        .update({ failed_attempts: newFailedAttempts })
        .eq("id", record.id)

      const remaining = MAX_FAILED_ATTEMPTS - newFailedAttempts
      return NextResponse.json(
        {
          error: `Incorrect code. Please check your email and try again. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
        },
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
