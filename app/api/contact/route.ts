export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"

// ── Resend free plan rules ────────────────────────────────────────────────────
// From: must be "onboarding@resend.dev"  (Resend's shared test domain, always works)
// To:   must be your own verified email  (vishwamistry18@gmail.com)
// ─────────────────────────────────────────────────────────────────────────────
const OWNER_EMAIL = "vishwamistry18@gmail.com"
const FROM_EMAIL  = "EduPilot <onboarding@resend.dev>"

// ─── Single email to owner: admin details + inline confirmation copy ──────────
function buildOwnerEmail(d: {
  firstName: string; lastName: string
  userEmail: string; subject: string; message: string
}): string {
  const now       = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "short" })
  const fullName  = `${d.firstName} ${d.lastName}`.trim()
  const ticketId  = `EP-${Date.now().toString(36).toUpperCase().slice(-6)}`
  const year      = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 16px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

  <!-- HEADER -->
  <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px 16px 0 0;padding:28px 36px;text-align:center;">
    <table cellpadding="0" cellspacing="0" align="center"><tr>
      <td style="background:rgba(255,255,255,0.13);border-radius:10px;padding:8px 18px;">
        <span style="font-size:22px;font-weight:900;color:#fff;font-family:Arial,sans-serif;">Edu<span style="color:#fbbf24;">Pilot</span></span>
      </td>
    </tr></table>
    <p style="color:rgba(255,255,255,0.8);margin:10px 0 0;font-size:13px;">New Contact Form Submission</p>
  </td></tr>

  <!-- ADMIN SECTION -->
  <tr><td style="background:#1e2130;padding:32px 36px;border-left:1px solid #2d3148;border-right:1px solid #2d3148;">
    <h2 style="color:#f1f5f9;font-size:17px;font-weight:700;margin:0 0 6px;">📬 New Message from Contact Form</h2>
    <p style="color:#64748b;font-size:12px;margin:0 0 20px;">Ticket: <strong style="color:#a5b4fc;font-family:'Courier New',monospace;">${ticketId}</strong> · ${now}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 4px;margin-bottom:20px;">
      ${[["Name", fullName], ["Email", d.userEmail], ["Subject", d.subject]].map(([label, value]) => `
      <tr>
        <td style="padding:8px 12px;background:#13161f;border-radius:6px 0 0 6px;width:80px;">
          <span style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">${label}</span>
        </td>
        <td style="padding:8px 12px;background:#1a1d2e;border-radius:0 6px 6px 0;border-left:2px solid #4f46e5;">
          <span style="color:#e2e8f0;font-size:13px;">${String(value).replace(/</g,"&lt;").replace(/>/g,"&gt;")}</span>
        </td>
      </tr>`).join("")}
    </table>

    <div style="background:#13161f;border:1px solid #2d3148;border-radius:10px;padding:18px;margin-bottom:20px;">
      <p style="color:#64748b;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;">Message</p>
      <p style="color:#e2e8f0;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap;">${d.message.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>
    </div>

    <div style="padding:12px 16px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.3);border-radius:8px;margin-bottom:28px;">
      <p style="color:#a5b4fc;font-size:13px;margin:0;">
        💡 Reply to: <a href="mailto:${d.userEmail}" style="color:#818cf8;font-weight:600;">${d.userEmail}</a>
        &nbsp;(set as reply-to — just hit Reply in Gmail)
      </p>
    </div>

    <!-- DIVIDER -->
    <hr style="border:none;border-top:1px dashed #2d3148;margin:0 0 28px;"/>

    <!-- USER CONFIRMATION COPY -->
    <p style="color:#94a3b8;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">
      📧 Auto-confirmation sent to user (preview copy)
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#13161f;border:1px solid #2d3148;border-radius:12px;">
      <tr><td style="padding:24px;">
        <div style="text-align:center;margin-bottom:18px;">
          <span style="font-size:36px;">✅</span>
        </div>
        <h3 style="color:#f1f5f9;font-size:18px;font-weight:700;margin:0 0 10px;text-align:center;">We've Received Your Message!</h3>
        <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 20px;text-align:center;">
          Hi <strong style="color:#e2e8f0;">${d.firstName}</strong>, thank you for reaching out to EduPilot.
          Our team will get back to you within <strong style="color:#a5b4fc;">24 hours</strong>.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1d2e;border:1px solid #2d3148;border-radius:10px;margin-bottom:18px;">
          <tr><td style="padding:16px 20px;">
            <p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Reference No.</p>
            <p style="color:#a5b4fc;font-size:16px;font-weight:700;margin:0 0 12px;font-family:'Courier New',monospace;">${ticketId}</p>
            <p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Subject</p>
            <p style="color:#e2e8f0;font-size:13px;margin:0;">${d.subject.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(79,70,229,0.08);border:1px solid rgba(79,70,229,0.2);border-radius:10px;">
          <tr><td style="padding:16px 20px;">
            <p style="color:#a5b4fc;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 14px;">What Happens Next?</p>
            ${[["🔍","Our team reviews your message","Every message is read by a real person."],["⚡","Response within 24 hours","Mon–Sat, 9 AM–7 PM IST."],["📧","We reply to your email","No need to contact us again."]].map(([icon,title,desc]) => `
            <table cellpadding="0" cellspacing="0" style="margin-bottom:10px;width:100%;"><tr>
              <td style="width:24px;font-size:16px;vertical-align:top;">${icon}</td>
              <td style="padding-left:10px;vertical-align:top;">
                <p style="color:#e2e8f0;font-size:13px;font-weight:600;margin:0 0 1px;">${title}</p>
                <p style="color:#64748b;font-size:12px;margin:0;">${desc}</p>
              </td>
            </tr></table>`).join("")}
          </td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#13161f;border-radius:0 0 16px 16px;border:1px solid #2d3148;border-top:none;padding:20px 36px;text-align:center;">
    <p style="color:#475569;font-size:12px;margin:0;">© ${year} EduPilot · +91 63527 51256 · contact@edupilot.ai</p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`
}

// ─── Send via Resend ──────────────────────────────────────────────────────────
async function resend(payload: { to: string; subject: string; html: string; text: string; replyTo?: string }) {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error("RESEND_API_KEY environment variable is not set in Vercel.")

  const body: Record<string, unknown> = {
    from:    FROM_EMAIL,
    to:      [payload.to],
    subject: payload.subject,
    html:    payload.html,
    text:    payload.text,
  }
  if (payload.replyTo) body.reply_to = payload.replyTo

  const res = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error: ${err}`)
  }
}

// ─── POST /api/contact ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, subject, message } = await req.json()

    if (!firstName || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Send ONE email to OWNER only (free plan: can only send to verified email)
    // Email contains: full admin details + user confirmation preview
    await resend({
      to:      OWNER_EMAIL,
      subject: `[EduPilot Contact] ${subject} — from ${firstName} ${lastName || ""}`.trim(),
      html:    buildOwnerEmail({
        firstName: firstName.trim(),
        lastName:  (lastName || "").trim(),
        userEmail: email.trim(),
        subject,
        message,
      }),
      text:    `New contact from ${firstName} ${lastName || ""} <${email}>\nSubject: ${subject}\n\n${message}`,
      replyTo: email,   // Hit Reply in Gmail → goes directly to user
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[contact]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send. Please try again." },
      { status: 500 }
    )
  }
}
