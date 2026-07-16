export const dynamic = "force-dynamic"

// ─── Study Plan Reminders — Vercel Cron target ─────────────────────────────────
//
// This route is NOT called by the browser. It's invoked on a schedule by
// Vercel Cron (see vercel.json at the repo root, which fires a GET request
// here every 15 minutes). There is no long-running process in this
// serverless deployment, so a Vercel Cron Job + API route is the standard
// way to get "near the scheduled time" reminder emails without a persistent
// node-cron/setInterval process (which wouldn't survive between invocations
// on Vercel anyway).
//
// IMPORTANT: the cron schedule in vercel.json only fires in a deployed
// Vercel project, and Cron Jobs must additionally be enabled for the
// project in the Vercel dashboard (Project Settings → Cron Jobs) — that
// can't be configured from this repo alone.
//
// What this route does on every invocation:
//   1. Loads every saved study plan that has reminders_enabled = true.
//   2. For each plan, finds today's tasks (day-of-month match, same
//      convention the planner UI uses) that are not yet completed and
//      whose scheduled time has passed within the last REMINDER_WINDOW_MINUTES
//      minutes (so a 15-minute cron cadence doesn't miss or double-send).
//   3. Skips any task id already present in notified_task_ids, so a task
//      is only ever emailed once.
//   4. Sends a single reminder email per plan (grouping multiple due
//      sessions if there happen to be more than one) and records the task
//      ids as notified.
//
// A failure while processing one plan/user is caught and logged — it does
// not abort the rest of the batch.

import { NextResponse } from "next/server"
import {
  getPlansWithRemindersEnabled,
  getUserEmailById,
  markStudyPlanTasksNotified,
  type SavedPlannerTask,
} from "@/lib/database"
import { transporter } from "@/lib/mailer"

// How far back from "now" a scheduled session is still considered "due".
// Should comfortably cover the cron interval (15 min) plus some slack for
// a missed/delayed invocation.
const REMINDER_WINDOW_MINUTES = 30

function parseTaskTime(time: string): { hours: number; minutes: number } | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(time?.trim() || "")
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null

  return { hours, minutes }
}

function isDueNow(task: SavedPlannerTask, now: Date): boolean {
  if (task.completed) return false
  if (Number(task.day) !== now.getDate()) return false

  const parsed = parseTaskTime(task.time)
  if (!parsed) return false

  const scheduledAt = new Date(now)
  scheduledAt.setHours(parsed.hours, parsed.minutes, 0, 0)

  const diffMs = now.getTime() - scheduledAt.getTime()
  const windowMs = REMINDER_WINDOW_MINUTES * 60 * 1000

  // Due if the scheduled time has already passed, but not so long ago that
  // it's stale (avoids blasting reminders for old/missed sessions).
  return diffMs >= 0 && diffMs <= windowMs
}

function buildReminderEmail(planTitle: string, tasks: SavedPlannerTask[]): string {
  const rows = tasks
    .map(
      (task) => `
<tr>
  <td style="padding:8px 12px;background:#13161f;border-radius:6px 0 0 6px;">
    <span style="color:#a5b4fc;font-family:'Courier New',monospace;">${task.time}</span>
  </td>
  <td style="padding:8px 12px;background:#1a1d2e;border-radius:0 6px 6px 0;border-left:2px solid #4f46e5;">
    <span style="color:#e2e8f0;font-size:13px;">${task.title} · ${task.subject}</span>
  </td>
</tr>`,
    )
    .join("")

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 16px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px 16px 0 0;padding:28px 36px;text-align:center;">
<span style="font-size:22px;font-weight:900;color:#fff;">Edu<span style="color:#fbbf24;">Pilot</span></span>
<p style="color:rgba(255,255,255,0.8);margin:10px 0 0;font-size:13px;">Study Plan Reminder</p>
</td></tr>
<tr><td style="background:#1e2130;padding:32px 36px;border-left:1px solid #2d3148;border-right:1px solid #2d3148;">
<h2 style="color:#f1f5f9;font-size:17px;font-weight:700;margin:0 0 6px;">It's time to study: ${planTitle}</h2>
<p style="color:#64748b;font-size:13px;margin:0 0 20px;">You have ${tasks.length} scheduled session${tasks.length > 1 ? "s" : ""} due now.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 4px;">
${rows}
</table>
</td></tr>
<tr><td style="background:#13161f;border-radius:0 0 16px 16px;border:1px solid #2d3148;border-top:none;padding:18px 36px;text-align:center;">
<p style="color:#475569;font-size:12px;margin:0;">You're receiving this because reminders are enabled for this study plan in EduPilot. Turn them off any time from the Planner page.</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`
}

export async function GET(req: Request) {
  // Optional shared-secret check. Set CRON_SECRET in the Vercel project env
  // vars and Vercel automatically sends it as `Authorization: Bearer
  // <CRON_SECRET>` for Cron Job invocations. If CRON_SECRET isn't set, the
  // route runs unauthenticated (fine for an idempotent, side-effect-limited
  // reminder sweep, but setting it is recommended in production).
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const now = new Date()
  const results = {
    plansChecked: 0,
    emailsSent: 0,
    tasksNotified: 0,
    errors: [] as string[],
  }

  try {
    const plans = await getPlansWithRemindersEnabled()
    results.plansChecked = plans.length

    for (const plan of plans) {
      try {
        const alreadyNotified = new Set(plan.notified_task_ids || [])
        const dueTasks = (plan.tasks || []).filter(
          (task) => isDueNow(task, now) && !alreadyNotified.has(task.id),
        )

        if (dueTasks.length === 0) continue

        const email = await getUserEmailById(plan.user_id)
        if (!email) {
          results.errors.push(`[plan ${plan.id}] no email found for user ${plan.user_id}`)
          continue
        }

        await transporter.sendMail({
          from: `EduPilot <${process.env.GMAIL_USER}>`,
          to: email,
          subject: `Reminder: ${plan.title} — study session${dueTasks.length > 1 ? "s" : ""} due now`,
          html: buildReminderEmail(plan.title, dueTasks),
        })

        await markStudyPlanTasksNotified(
          plan.id,
          plan.notified_task_ids || [],
          dueTasks.map((task) => task.id),
        )

        results.emailsSent += 1
        results.tasksNotified += dueTasks.length
      } catch (planErr) {
        // A failure sending one plan's reminder must not abort the batch.
        const message = planErr instanceof Error ? planErr.message : String(planErr)
        console.error(`[planner/send-reminders] Failed for plan ${plan.id}:`, planErr)
        results.errors.push(`[plan ${plan.id}] ${message}`)
      }
    }

    return NextResponse.json({ success: true, ...results })
  } catch (err) {
    console.error("[planner/send-reminders] Fatal error:", err)
    const message = err instanceof Error ? err.message : "Failed to process reminders"
    return NextResponse.json({ success: false, error: message, ...results }, { status: 500 })
  }
}
