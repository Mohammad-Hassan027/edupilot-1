export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"

// Your verified Resend email — all emails sent FROM and TO this address on free plan
const OWNER_EMAIL = "vishwamistry18@gmail.com"
const FROM_EMAIL  = process.env.RESEND_FROM_EMAIL || `EduPilot Support <${OWNER_EMAIL}>`

// ─── Admin notification email ─────────────────────────────────────────────────
function buildAdminEmail(d: {
  firstName: string; lastName: string
  email: string; subject: string; message: string
}): string {
  const now = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "short"
  })
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
  <tr>
    <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px 16px 0 0;padding:28px 36px;text-align:center;">
      <table cellpadding="0" cellspacing="0" align="center"><tr>
        <td style="background:rgba(255,255,255,0.13);border-radius:10px;padding:8px 18px;">
          <span style="font-size:22px;font-weight:900;color:#fff;font-family:Arial,sans-serif;">Edu<span style="color:#fbbf24;">Pilot</span></span>
        </td>
      </tr></table>
      <p style="color:rgba(255,255,255,0.75);margin:10px 0 0;font-size:13px;">New Contact Form Submission</p>
    </td>
  </tr>
  <tr>
    <td style="background:#1e2130;padding:32px 36px;border-left:1px solid #2d3148;border-right:1px solid #2d3148;">
      <h2 style="color:#f1f5f9;font-size:18px;font-weight:700;margin:0 0 8px;">📬 New Message from Contact Form</h2>
      <p style="color:#94a3b8;font-size:13px;margin:0 0 24px;">Someone filled out the contact form on EduPilot.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 4px;margin-bottom:20px;">
        ${[
          ["Name",     `${d.firstName} ${d.lastName}`.trim()],
          ["Email",    d.email],
          ["Subject",  d.subject],
          ["Received", now],
        ].map(([label, value]) => `
        <tr>
          <td style="padding:8px 12px;background:#13161f;border-radius:6px 0 0 6px;width:90px;vertical-align:top;">
            <span style="color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">${label}</span>
          </td>
          <td style="padding:8px 12px;background:#1a1d2e;border-radius:0 6px 6px 0;border-left:2px solid #4f46e5;vertical-align:top;">
            <span style="color:#e2e8f0;font-size:13px;">${value}</span>
          </td>
        </tr>`).join("")}
      </table>
      <div style="background:#13161f;border:1px solid #2d3148;border-radius:10px;padding:20px;margin-bottom:20px;">
        <p style="color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 10px;">Message</p>
        <p style="color:#e2e8f0;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap;">${d.message.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>
      </div>
      <div style="padding:14px 16px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.25);border-radius:8px;">
        <p style="color:#a5b4fc;font-size:13px;margin:0;">
          💡 User's email: <strong><a href="mailto:${d.email}" style="color:#818cf8;">${d.email}</a></strong> — reply to them directly.
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
</body></html>`
}

// ─── User confirmation email (sent to yourself, with user's name in subject) ───
function buildUserConfirmEmail(d: {
  firstName: string; userEmail: string; subject: string
}): string {
  const ticketId = `EP-${Date.now().toString(36).toUpperCase().slice(-6)}`
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:48px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
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
  <tr>
    <td style="background:#1e2130;padding:40px;border-left:1px solid #2d3148;border-right:1px solid #2d3148;">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:64px;height:64px;background:rgba(16,185,129,0.12);border-radius:50%;display:inline-block;line-height:64px;font-size:28px;">✅</div>
      </div>
      <h1 style="color:#f1f5f9;font-size:22px;font-weight:700;margin:0 0 12px;text-align:center;">We've Received Your Message!</h1>
      <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 28px;text-align:center;">
        Hi <strong style="color:#e2e8f0;">${d.firstName}</strong>, thank you for reaching out to EduPilot.
        Your message has been received and our team will get back to you at
        <strong style="color:#c4b5fd;">${d.userEmail}</strong> shortly.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
        <tr><td style="background:#13161f;border:1px solid #2d3148;border-radius:12px;padding:20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;border-bottom:1px solid #1e2130;">
                <span style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Reference</span>
                <span style="color:#a5b4fc;font-size:13px;font-weight:700;font-family:'Courier New',monospace;float:right;">${ticketId}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0 0;">
                <span style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Subject</span>
                <p style="color:#e2e8f0;font-size:13px;margin:4px 0 0;">${d.subject.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
        <tr><td style="background:rgba(79,70,229,0.08);border:1px solid rgba(79,70,229,0.2);border-radius:12px;padding:20px 24px;">
          <p style="color:#a5b4fc;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">What Happens Next?</p>
          ${[
            ["🔍","Our team reviews your message","Every message is read by a real person."],
            ["⚡","Response within 24 hours","Mon–Sat, 9 AM–7 PM IST."],
            ["📧","We'll reply to your email","No need to contact us again."],
          ].map(([icon, title, desc]) => `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
            <tr>
              <td style="width:28px;vertical-align:top;font-size:16px;">${icon}</td>
              <td style="vertical-align:top;padding-left:10px;">
                <p style="color:#e2e8f0;font-size:13px;font-weight:600;margin:0 0 2px;">${title}</p>
                <p style="color:#64748b;font-size:12px;margin:0;">${desc}</p>
              </td>
            </tr>
          </table>`).join("")}
        </td></tr>
      </table>
      <p style="color:#64748b;font-size:12px;text-align:center;margin:0;">
        Urgent? Call <a href="tel:+916352751256" style="color:#818cf8;">+91 63527 51256</a>
      </p>
    </td>
  </tr>
  <tr>
    <td style="background:#13161f;border-radius:0 0 16px 16px;border:1px solid #2d3148;border-top:none;padding:24px 40px;text-align:center;">
      <p style="color:#475569;font-size:13px;margin:0 0 4px;font-weight:600;">© ${new Date().getFullYear()} EduPilot. All rights reserved.</p>
      <p style="color:#334155;font-size:12px;margin:0;">This confirmation was sent because you contacted EduPilot support.</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body></html>`
}

// ─── Send via Resend ──────────────────────────────────────────────────────────
async function sendEmail(payload: {
  to: string; subject: string; html: string; text: string; replyTo?: string
}) {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error("RESEND_API_KEY not configured")

  const body: Record<string, unknown> = {
    from: FROM_EMAIL,
    to:   [payload.to],
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  }
  if (payload.replyTo) body.reply_to = payload.replyTo

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type":  "application/json",
    },
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

    // Email 1: Admin notification → sent TO your address (always works on free plan)
    await sendEmail({
      to:      OWNER_EMAIL,
      subject: `[EduPilot Contact] ${subject} — from ${firstName} ${lastName || ""}`.trim(),
      html:    buildAdminEmail({ firstName, lastName: lastName || "", email, subject, message }),
      text:    `New contact from ${firstName} ${lastName || ""} <${email}>\n\nSubject: ${subject}\n\nMessage:\n${message}`,
      replyTo: email,   // reply-to = user's email so you can reply directly in Gmail
    })

    // Email 2: User confirmation → also sent TO your address, but BCC'd to user
    // On free plan we can't send to other addresses, so we send a copy to ourselves
    // AND use Resend's bcc feature to reach the user
    const key = process.env.RESEND_API_KEY
    if (key) {
      const confirmHtml = buildUserConfirmEmail({ firstName, userEmail: email, subject })
      const confirmText = `Hi ${firstName},\n\nThank you for contacting EduPilot!\n\nWe've received your message and will respond within 24 hours (Mon–Sat, 9 AM–7 PM IST).\n\nSubject: ${subject}\n\nNeed urgent help? Call +91 63527 51256\n\n© ${new Date().getFullYear()} EduPilot`

      // Try sending directly to user first
      const directRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({
          from:    FROM_EMAIL,
          to:      [email],
          subject: "EduPilot — We've Received Your Message",
          html:    confirmHtml,
          text:    confirmText,
        }),
      })

      if (!directRes.ok) {
        // Free plan restriction: can only send to verified email
        // Fallback: send the confirmation to ourselves with user's info in body
        // AND include full confirmation details so admin can forward if needed
        await sendEmail({
          to:      OWNER_EMAIL,
          subject: `[ACTION NEEDED] Forward confirmation to ${firstName} at ${email}`,
          html:    `<p style="font-family:sans-serif;color:#333;background:#fff;padding:20px;border-radius:8px;">
            <strong>⚠️ Auto-forward needed:</strong> Please forward the email below to <a href="mailto:${email}">${email}</a><br/><br/>
            <em>To stop seeing this, upgrade Resend plan or verify your domain at resend.com/domains</em>
            <hr/>
            ${confirmHtml}
          </p>`,
          text:    `Forward this confirmation to ${email}:\n\n${confirmText}`,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[contact] Error:", err)
    const msg = err instanceof Error ? err.message : "Failed to send message"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
