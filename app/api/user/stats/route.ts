export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getSupabaseAdmin } from "@/lib/supabase-server"

export async function GET() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = await getSupabaseAdmin()

    const { data: logs } = await admin
      .from("usage_logs")
      .select("feature, action, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    const allLogs = logs || []
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const quizzesTaken = allLogs.filter((l) => l.feature === "quiz").length
    const aiChats = allLogs.filter((l) => l.feature === "ai_chat").length
    const flashcardSessions = allLogs.filter((l) => l.feature === "flashcards").length

    const estimatedMinutes = aiChats * 5 + flashcardSessions * 3 + quizzesTaken * 10
    const learningHours = (estimatedMinutes / 60).toFixed(1)

    const thisWeekLogs = allLogs.filter((l) => new Date(l.created_at) >= oneWeekAgo)
    const lastWeekLogs = allLogs.filter(
      (l) => new Date(l.created_at) >= twoWeeksAgo && new Date(l.created_at) < oneWeekAgo
    )
    const thisWeekCount = thisWeekLogs.length
    const lastWeekCount = lastWeekLogs.length
    const weekTrend =
      lastWeekCount === 0
        ? thisWeekCount > 0 ? "+100%" : "0%"
        : `${thisWeekCount >= lastWeekCount ? "+" : ""}${Math.round(
            ((thisWeekCount - lastWeekCount) / lastWeekCount) * 100
          )}%`

    // Streak
    const activityDays = new Set(
      allLogs.map((l) => new Date(l.created_at).toISOString().split("T")[0])
    )
    let streak = 0
    for (let i = 0; i < 365; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split("T")[0]
      if (activityDays.has(key)) streak++
      else if (i > 0) break
    }

    // Weekly activity for chart — last 7 days with counts
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (6 - i))
      const key = d.toISOString().split("T")[0]
      const count = allLogs.filter((l) => l.created_at.startsWith(key)).length
      return { day: dayLabels[d.getDay()], count }
    })

    return NextResponse.json({
      streak, learningHours, quizzesTaken, aiChats, flashcardSessions,
      weekTrend, thisWeekCount, lastWeekCount, weeklyActivity,
    })
  } catch (err) {
    console.error("[user/stats]", err)
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 })
  }
}
