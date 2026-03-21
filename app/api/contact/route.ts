export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"

const ADMIN_EMAIL = "vishwamistry18@gmail.com"
const FROM_EMAIL  = process.env.RESEND_FROM_EMAIL || "EduPilot <onboarding@resend.dev>"

// ─── Email to admin: full query details ──────────────────────────────────────
function buildAdminEmail(data: {
  firstName: string; lastName: string
  email: string; subject: string; message: string
}): string {
  const { firstName, lastName, email, subject, message } = data
  const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "short" })
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px 16px 0 0;padding:28px 36px;">
            <table cellpadding="0" cellspacing="0" align="center"><tr>
              <td style="background:rgba(255,255,255,0.13);border-radius:10px;padding:8px 18px;">
                <span style="font-size:22px;font-weight:900;color:#fff;font-family:Arial,sans-serif;">Edu<span style="color:#fbbf24;">Pilot</span></span>
              </td>
            </tr></table>
            <p style="color:rgba(255,255,255,0.75);margin:10px 0 0;font-size:13px;text-align:center;">New Contact Form Submission</p>
          </td>
        </tr>
        <tr>
          <td style="background:#1e2130;padding:32px 36px;border-left:1px solid #2d3148;border-right:1px solid #2d3148;">
            <h2 style="color:#f1f5f9;font-size:18px;font-weight:700;margin:0 0 20px;">📬 New Message from Contact Form</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              ${[
                ["Name",    `${firstName} ${lastName}`],
                ["Email",   email],
                ["Subject", subject],
                ["Received",now],
              ].map(([label, value]) => `
              <tr>
                <td style="padding:8px 12px;background:#13161f;border-radius:6px 0 0 6px;width:90px;">
                  <span style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">${label}</span>
                </td>
                <td style="padding:8px 12px;background:#1a1d2e;border-radius:0 6px 6px 0;border-left:2px solid #4f46e5;">
                  <span style="color:#e2e8f0;font-size:14px;">${value}</span>
                </td>
              </tr>
              <tr><td colspan="2" style="height:4px;"></td></tr>`).join("")}
            </table>
            <div style="background:#13161f;border:1px solid #2d3148;border-radius:10px;padding:20px;">
              <p style="color:#94a3b8;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Message</p>
              <p style="color:#e2e8f0;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap;">${message.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>
            </div>
            <div style="margin-top:24px;padding:14px 16px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.25);border-radius:8px;">
              <p style="color:#a5b4fc;font-size:13px;margin:0;">
                💡 Reply directly to this email to respond to <strong>${firstName}</strong> at <a href="mailto:${email}" style="color:#818cf8;">${email}</a>
              </p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#13161f;border-radius:0 0 16px 16px;border:1px solid #2d3148;border-top:none;padding:20px 36px;text-align:center;">
            <p style="color:#475569;font-size:12px;margin:0;">© ${new Date().getFullYear()} EduPilot — Admin Notification</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Confirmation email to user ───────────────────────────────────────────────
function buildUserEmail(data: {
  firstName: string; subject: string
}): string {
  const { firstName, subject } = data
  const ticketId = `EP-${Date.now().toString(36).toUpperCase().slice(-6)}`
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:48px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
            <table cellpadding="0" cellspacing="0" border="0" align="center"><tr>
              <td style="background:rgba(255,255,255,0.13);border-radius:12px;padding:10px 22px;">
                <span style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;font-family:Arial,sans-serif;">Edu<span style="color:#fbbf24;">Pilot</span></span>
              </td>
            </tr></table>
            <p style="color:rgba(255,255,255,0.7);margin:14px 0 0;font-size:14px;">AI-Powered Study Assistant</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#1e2130;padding:40px;border-left:1px solid #2d3148;border-right:1px solid #2d3148;">

            <!-- Success icon -->
            <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:28px;">
              <tr><td align="center">
                <div style="width:64px;height:64px;background:rgba(16,185,129,0.12);border-radius:50%;display:inline-block;text-align:center;line-height:64px;font-size:30px;">✅</div>
              </td></tr>
            </table>

            <h1 style="color:#f1f5f9;font-size:22px;font-weight:700;margin:0 0 14px;text-align:center;">We've received your message!</h1>
            <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 28px;text-align:center;">
              Hi <strong style="color:#e2e8f0;">${firstName}</strong>, thank you for reaching out to EduPilot Support.
              Your message has been received and our team will get back to you shortly.
            </p>

            <!-- Ticket info box -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
              <tr><td style="background:#13161f;border:1px solid #2d3148;border-radius:12px;padding:20px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;border-bottom:1px solid #1e2130;">
                      <span style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Reference No.</span>
                      <span style="color:#a5b4fc;font-size:14px;font-weight:700;float:right;font-family:'Courier New',monospace;">${ticketId}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0 0;">
                      <span style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Subject</span>
                      <p style="color:#e2e8f0;font-size:14px;margin:4px 0 0;">${subject.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- What happens next -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
              <tr><td style="background:rgba(79,70,229,0.08);border:1px solid rgba(79,70,229,0.2);border-radius:12px;padding:20px 24px;">
                <p style="color:#a5b4fc;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin:0 0 14px;">What happens next?</p>
                ${[
                  ["🔍", "Our team reviews your message",       "We read every submission carefully."],
                  ["⚡", "You'll hear from us within 24 hours", "Mon–Sat, 9 AM–7 PM IST."],
                  ["✉️", "Reply to this email",                 "To add more details to your query."],
                ].map(([icon, title, desc]) => `
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                  <tr>
                    <td style="width:32px;vertical-align:top;font-size:18px;">${icon}</td>
                    <td style="vertical-align:top;padding-left:10px;">
                      <p style="color:#e2e8f0;font-size:14px;font-weight:600;margin:0 0 2px;">${title}</p>
                      <p style="color:#64748b;font-size:13px;margin:0;">${desc}</p>
                    </td>
                  </tr>
                </table>`).join("")}
              </td></tr>
            </table>

            <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0;text-align:center;">
              Need urgent help? Call us at <a href="tel:+916352751256" style="color:#818cf8;">+91 63527 51256</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#13161f;border-radius:0 0 16px 16px;border:1px solid #2d3148;border-top:none;padding:24px 40px;text-align:center;">
            <p style="color:#475569;font-size:13px;margin:0 0 6px;font-weight:600;">© ${new Date().getFullYear()} EduPilot. All rights reserved.</p>
            <p style="color:#334155;font-size:12px;margin:0;">This is an automated confirmation. Please do not reply to the Supabase sender.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Send via Resend ──────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string, text: string, replyTo?: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error("RESEND_API_KEY not configured")

  const body: Record<string, unknown> = { from: FROM_EMAIL, to: [to], subject, html, text }
  if (replyTo) body.reply_to = replyTo

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error: ${err}`)
  }
}

// ─── POST /api/contact ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { firstName, lastName, email, subject, message } = body

    if (!firstName || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const name = `${firstName.trim()} ${(lastName || "").trim()}`.trim()

    // 1. Notify admin
    await sendEmail(
      ADMIN_EMAIL,
      `[EduPilot Contact] ${subject}`,
      buildAdminEmail({ firstName: firstName.trim(), lastName: (lastName || "").trim(), email, subject, message }),
      `New contact form message from ${name} <${email}>\n\nSubject: ${subject}\n\nMessage:\n${message}`,
      email   // reply-to set to user's email so admin can reply directly
    )

    // 2. Confirm to user
    await sendEmail(
      email,
      "EduPilot — We've Received Your Message",
      buildUserEmail({ firstName: firstName.trim(), subject }),
      `Hi ${firstName.trim()},\n\nThank you for contacting EduPilot Support!\n\nWe've received your message and our team will respond within 24 hours (Mon–Sat, 9 AM–7 PM IST).\n\nSubject: ${subject}\n\nIf you need urgent help, call us at +91 63527 51256.\n\n© ${new Date().getFullYear()} EduPilot`
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[contact] Error:", err)
    const msg = err instanceof Error ? err.message : "Failed to send message"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
