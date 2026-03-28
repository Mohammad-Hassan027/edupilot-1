export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getSupabaseAdmin } from "@/lib/supabase-server"

type UsageLogRow = {
  feature: string
  action: string
  created_at: string
}

type ActivitySessionRow = {
  duration_seconds: number
  started_at: string
  last_seen_at: string | null
}

type ChartPoint = {
  label: string
  count: number
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function toDayKey(value: string | Date) {
  return new Date(value).toISOString().split("T")[0]
}

function formatMonthLabel(date: Date) {
  return date.toLocaleString("en-US", { month: "short" })
}

function formatHours(seconds: number) {
  return (seconds / 3600).toFixed(1)
}

function buildWeeklyActivity(logs: UsageLogRow[], sessions: ActivitySessionRow[]): ChartPoint[] {
  const today = startOfDay(new Date())

  return Array.from({ length: 7 }).map((_, index) => {
    const current = new Date(today)
    current.setDate(today.getDate() - (6 - index))
    const key = toDayKey(current)

    const usageCount = logs.filter((log) => toDayKey(log.created_at) === key).length
    const sessionCount = sessions.filter((session) => toDayKey(session.started_at) === key).length

    return {
      label: current.toLocaleString("en-US", { weekday: "short" }),
      count: usageCount + sessionCount,
    }
  })
}

function buildMonthlyActivity(logs: UsageLogRow[], sessions: ActivitySessionRow[]): ChartPoint[] {
  const now = new Date()

  return Array.from({ length: 6 }).map((_, index) => {
    const current = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    const year = current.getFullYear()
    const month = current.getMonth()

    const usageCount = logs.filter((log) => {
      const createdAt = new Date(log.created_at)
      return createdAt.getFullYear() === year && createdAt.getMonth() === month
    }).length

    const sessionCount = sessions.filter((session) => {
      const startedAt = new Date(session.started_at)
      return startedAt.getFullYear() === year && startedAt.getMonth() === month
    }).length

    return {
      label: formatMonthLabel(current),
      count: usageCount + sessionCount,
    }
  })
}

function getFeatureUsageCounts(logs: UsageLogRow[]) {
  const counts = {
    ai_tutor: 0,
    notes: 0,
    flashcards: 0,
    quiz: 0,
    planner: 0,
    ai_voice: 0,
  }

  for (const log of logs) {
    if (log.feature === "ai_chat") counts.ai_tutor += 1
    if (log.feature === "notes") counts.notes += 1
    if (log.feature === "flashcards") counts.flashcards += 1
    if (log.feature === "quiz") counts.quiz += 1
    if (log.feature === "study_plan") counts.planner += 1
    if (log.feature === "ai_voice") counts.ai_voice += 1
  }

  return counts
}

function getEngagementLevel(secondsThisWeek: number, activeDaysThisWeek: number, totalActions: number) {
  if (secondsThisWeek >= 4 * 3600 || activeDaysThisWeek >= 5 || totalActions >= 25) return "High"
  if (secondsThisWeek >= 90 * 60 || activeDaysThisWeek >= 3 || totalActions >= 10) return "Medium"
  return "Low"
}

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = await getSupabaseAdmin()

    const [{ data: logs, error: logsError }, { data: sessions, error: sessionsError }] = await Promise.all([
      admin.from("usage_logs").select("feature, action, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      admin
        .from("user_activity_sessions")
        .select("duration_seconds, started_at, last_seen_at")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false }),
    ])

    if (logsError) throw new Error(logsError.message)

    const sessionTableMissing = sessionsError?.message?.toLowerCase().includes("user_activity_sessions")
    if (sessionsError && !sessionTableMissing) throw new Error(sessionsError.message)

    const allLogs = (logs || []) as UsageLogRow[]
    const allSessions = sessionTableMissing ? [] : ((sessions || []) as ActivitySessionRow[])

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const quizzesTaken = allLogs.filter((log) => log.feature === "quiz").length
    const totalActivities = allLogs.length
    const featureUsage = getFeatureUsageCounts(allLogs)

    const thisWeekLogs = allLogs.filter((log) => new Date(log.created_at) >= oneWeekAgo)
    const lastWeekLogs = allLogs.filter(
      (log) => new Date(log.created_at) >= twoWeeksAgo && new Date(log.created_at) < oneWeekAgo
    )

    const thisWeekSessions = allSessions.filter((session) => new Date(session.started_at) >= oneWeekAgo)
    const lastWeekSessions = allSessions.filter(
      (session) => new Date(session.started_at) >= twoWeeksAgo && new Date(session.started_at) < oneWeekAgo
    )

    const thisMonthSessions = allSessions.filter((session) => new Date(session.started_at) >= currentMonthStart)
    const thisMonthLogs = allLogs.filter((log) => new Date(log.created_at) >= currentMonthStart)

    const thisWeekSeconds = thisWeekSessions.reduce((sum, session) => sum + (session.duration_seconds || 0), 0)
    const lastWeekSeconds = lastWeekSessions.reduce((sum, session) => sum + (session.duration_seconds || 0), 0)
    const totalTrackedSeconds = allSessions.reduce((sum, session) => sum + (session.duration_seconds || 0), 0)

    const weekTrend =
      lastWeekSeconds === 0
        ? thisWeekSeconds > 0
          ? "+100%"
          : "0%"
        : `${thisWeekSeconds >= lastWeekSeconds ? "+" : ""}${Math.round(
            ((thisWeekSeconds - lastWeekSeconds) / lastWeekSeconds) * 100
          )}%`

    const weeklyActivity = buildWeeklyActivity(allLogs, allSessions)
    const monthlyActivity = buildMonthlyActivity(allLogs, allSessions)
    const activeDaysThisWeek = new Set(thisWeekSessions.map((session) => toDayKey(session.started_at))).size
    const activeDaysThisMonth = new Set([
      ...thisMonthSessions.map((session) => toDayKey(session.started_at)),
      ...thisMonthLogs.map((log) => toDayKey(log.created_at)),
    ]).size

    const engagementLevel = getEngagementLevel(thisWeekSeconds, activeDaysThisWeek, thisWeekLogs.length)

    return NextResponse.json({
      learningHours: formatHours(thisWeekSeconds),
      totalLearningHours: formatHours(totalTrackedSeconds),
      trackedSecondsThisWeek: thisWeekSeconds,
      totalTrackedSeconds,
      quizzesTaken,
      totalActivities,
      weekTrend,
      thisWeekCount: thisWeekLogs.length,
      lastWeekCount: lastWeekLogs.length,
      activeDaysThisWeek,
      activeDaysThisMonth,
      weeklyActivity,
      monthlyActivity,
      featureUsage,
      engagementLevel,
    })
  } catch (err) {
    console.error("[user/stats] Error:", err)
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 })
  }
}
