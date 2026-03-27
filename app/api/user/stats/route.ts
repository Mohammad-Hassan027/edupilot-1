export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getSupabaseAdmin } from "@/lib/supabase-server"

type UsageLogRow = {
  feature: string
  action: string
  created_at: string
}

type ChartPoint = {
  label: string
  count: number
}

const CHAT_FEATURES = new Set(["ai_chat", "ai_file_analysis", "ai_web_search"])

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

function buildWeeklyActivity(logs: UsageLogRow[]): ChartPoint[] {
  const today = startOfDay(new Date())

  return Array.from({ length: 7 }).map((_, index) => {
    const current = new Date(today)
    current.setDate(today.getDate() - (6 - index))
    const key = toDayKey(current)

    return {
      label: current.toLocaleString("en-US", { weekday: "short" }),
      count: logs.filter((log) => toDayKey(log.created_at) === key).length,
    }
  })
}

function buildMonthlyActivity(logs: UsageLogRow[]): ChartPoint[] {
  const now = new Date()

  return Array.from({ length: 6 }).map((_, index) => {
    const current = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    const year = current.getFullYear()
    const month = current.getMonth()

    return {
      label: formatMonthLabel(current),
      count: logs.filter((log) => {
        const createdAt = new Date(log.created_at)
        return createdAt.getFullYear() === year && createdAt.getMonth() === month
      }).length,
    }
  })
}

function calculateCurrentStreak(logs: UsageLogRow[]) {
  const activityDays = new Set(logs.map((log) => toDayKey(log.created_at)))
  const today = startOfDay(new Date())
  let streak = 0

  for (let i = 0; i < 365; i++) {
    const current = new Date(today)
    current.setDate(today.getDate() - i)
    const key = toDayKey(current)

    if (activityDays.has(key)) {
      streak += 1
      continue
    }

    if (i === 0) {
      continue
    }

    break
  }

  return streak
}

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = await getSupabaseAdmin()

    const { data: logs, error } = await admin
      .from("usage_logs")
      .select("feature, action, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    const allLogs = (logs || []) as UsageLogRow[]
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const quizzesTaken = allLogs.filter((log) => log.feature === "quiz").length
    const chatActivities = allLogs.filter((log) => CHAT_FEATURES.has(log.feature)).length
    const flashcardSessions = allLogs.filter((log) => log.feature === "flashcards").length
    const notesSessions = allLogs.filter((log) => log.feature === "notes").length
    const plannerSessions = allLogs.filter((log) => log.feature === "study_plan").length
    const totalActivities = allLogs.length

    const estimatedMinutes =
      chatActivities * 5 +
      flashcardSessions * 4 +
      quizzesTaken * 10 +
      notesSessions * 8 +
      plannerSessions * 6

    const learningHours = (estimatedMinutes / 60).toFixed(1)

    const thisWeekLogs = allLogs.filter((log) => new Date(log.created_at) >= oneWeekAgo)
    const lastWeekLogs = allLogs.filter(
      (log) => new Date(log.created_at) >= twoWeeksAgo && new Date(log.created_at) < oneWeekAgo
    )

    const thisMonthLogs = allLogs.filter((log) => new Date(log.created_at) >= currentMonthStart)

    const thisWeekCount = thisWeekLogs.length
    const lastWeekCount = lastWeekLogs.length
    const weekTrend =
      lastWeekCount === 0
        ? thisWeekCount > 0
          ? "+100%"
          : "0%"
        : `${thisWeekCount >= lastWeekCount ? "+" : ""}${Math.round(
            ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100
          )}%`

    const weeklyActivity = buildWeeklyActivity(allLogs)
    const monthlyActivity = buildMonthlyActivity(allLogs)
    const activeDaysThisWeek = weeklyActivity.filter((day) => day.count > 0).length
    const activeDaysThisMonth = new Set(thisMonthLogs.map((log) => toDayKey(log.created_at))).size
    const streak = calculateCurrentStreak(allLogs)

    return NextResponse.json({
      streak,
      learningHours,
      quizzesTaken,
      aiChats: chatActivities,
      flashcardSessions,
      notesSessions,
      plannerSessions,
      totalActivities,
      weekTrend,
      thisWeekCount,
      lastWeekCount,
      activeDaysThisWeek,
      activeDaysThisMonth,
      weeklyActivity,
      monthlyActivity,
    })
  } catch (err) {
    console.error("[user/stats] Error:", err)
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 })
  }
}
