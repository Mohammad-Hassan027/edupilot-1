export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import * as crypto from "crypto"

// ─── Generate a 6-digit numeric OTP ─────────────────────────────────────────
function generateOTP(): string {
  // Use crypto.randomInt for cryptographically secure random number
  return crypto.randomInt(100000, 999999).toString()
}

// ─── Hash the OTP before storing (sha256) ────────────────────────────────────
function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex")
}

// ─── Build professional branded HTML email ───────────────────────────────────
function buildEmailHTML(toEmail: string, otp: string): string {
  const year = new Date().getFullYear()
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Reset your EduPilot password</title>
</head>
<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f1117;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

          <!-- ── HEADER ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td style="background:rgba(255,255,255,0.13);border-radius:12px;padding:10px 22px;">
                    <span style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;font-family:Arial,sans-serif;">
                      Edu<span style="color:#fbbf24;">Pilot</span>
                    </span>
                  </td>
                </tr>
              </table>
              <p style="color:rgba(255,255,255,0.7);margin:14px 0 0;font-size:14px;letter-spacing:0.3px;">AI-Powered Study Assistant</p>
            </td>
          </tr>

          <!-- ── BODY ── -->
          <tr>
            <td style="background:#1e2130;padding:40px;border-left:1px solid #2d3148;border-right:1px solid #2d3148;">
              <h1 style="color:#f1f5f9;font-size:22px;font-weight:700;margin:0 0 12px;line-height:1.3;">Reset Your Password</h1>
              <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 32px;">
                Hi! We received a request to reset the password for your EduPilot account
                associated with <strong style="color:#c4b5fd;">${toEmail}</strong>.
                Enter the 6-digit code below within <strong style="color:#f1f5f9;">10 minutes</strong>.
              </p>

              <!-- OTP BOX -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:4px 0 36px;">
                    <table cellpadding="0" cellspacing="0" border="0"
                      style="background:linear-gradient(135deg,rgba(79,70,229,0.18),rgba(124,58,237,0.18));
                             border:2px solid #6366f1;border-radius:16px;padding:28px 48px;text-align:center;">
                      <tr>
                        <td>
                          <p style="color:#a5b4fc;font-size:11px;font-weight:700;letter-spacing:4px;
                                    text-transform:uppercase;margin:0 0 16px;font-family:Arial,sans-serif;">
                            Verification Code
                          </p>
                          <p style="color:#ffffff;font-size:52px;font-weight:900;letter-spacing:18px;
                                    margin:0;font-family:'Courier New',Courier,monospace;line-height:1;">
                            ${otp}
                          </p>
                          <p style="color:#64748b;font-size:12px;margin:16px 0 0;">
                            ⏱ Expires in <strong style="color:#94a3b8;">10 minutes</strong>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px;">
                Enter this code on the EduPilot password reset page.
                Do not share this code with anyone — EduPilot staff will never ask for it.
              </p>


            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background:#13161f;border-radius:0 0 16px 16px;
                       border:1px solid #2d3148;border-top:none;padding:24px 40px;text-align:center;">
              <p style="color:#475569;font-size:13px;margin:0 0 6px;font-weight:600;">
                © ${year} EduPilot. All rights reserved.
              </p>
              <p style="color:#334155;font-size:12px;margin:0;">
                This email was sent to ${toEmail} because a password reset was requested for this account.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── Send email via Resend API ────────────────────────────────────────────────
async function sendEmail(to: string, otp: string): Promise<boolean> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY

  if (!RESEND_API_KEY) {
    console.error("[forgot-password] RESEND_API_KEY not set. Cannot send email.")
    return false
  }

  const fromAddress =
    process.env.RESEND_FROM_EMAIL || "EduPilot <onboarding@resend.dev>"

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:    fromAddress,
      to:      [to],
      subject: "EduPilot — Password Reset Request",
      html:    buildEmailHTML(to, otp),
      text:    `EduPilot Password Reset\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, please ignore this email.\n\n© ${new Date().getFullYear()} EduPilot`,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("[forgot-password] Resend error:", err)
    return false
  }

  return true
}

// ─── POST handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const admin = await getSupabaseAdmin()

    // ── Check user exists (don't reveal if they don't) ──────────────────────
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const user = users?.find(u => u.email?.toLowerCase() === normalizedEmail)

    if (!user) {
      // Return success silently — don't reveal account existence
      return NextResponse.json({ success: true })
    }

    // ── Generate OTP ─────────────────────────────────────────────────────────
    const otp     = generateOTP()
    const otpHash = hashOTP(otp)
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // ── Delete any existing OTPs for this email ───────────────────────────────
    await admin
      .from("password_reset_otps")
      .delete()
      .eq("email", normalizedEmail)

    // ── Store hashed OTP ──────────────────────────────────────────────────────
    const { error: insertError } = await admin
      .from("password_reset_otps")
      .insert({
        email:      normalizedEmail,
        otp_hash:   otpHash,
        expires_at: expires.toISOString(),
        used:       false,
      })

    if (insertError) {
      console.error("[forgot-password] DB insert error:", insertError.message)
      return NextResponse.json({ error: "Failed to generate reset code" }, { status: 500 })
    }

    // ── Send branded email ────────────────────────────────────────────────────
    const sent = await sendEmail(normalizedEmail, otp)

    if (!sent) {
      // Clean up the stored OTP since we couldn't send
      await admin.from("password_reset_otps").delete().eq("email", normalizedEmail)
      return NextResponse.json(
        { error: "Failed to send email. Please check your email address and try again." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[forgot-password] Unexpected error:", err)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
