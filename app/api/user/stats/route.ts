import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getSupabaseAdmin } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

type UsageLogRow = {
  feature: string
  created_at: string
  metadata?: Record<string, unknown> | null
}

type ActivitySessionRow = {
  duration_seconds: number
  started_at: string
  last_seen_at: string | null
}

type SavedNoteRow = {
  id: string
  created_at: string
  source_title: string | null
  source_type: string | null
}

type SavedQuizAttemptRow = {
  id: string
  created_at: string
  score: number
  total_questions: number
  percentage: number
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

function buildWeeklyActivity(
  logs: UsageLogRow[],
  sessions: ActivitySessionRow[],
  savedNotes: SavedNoteRow[],
  quizAttempts: SavedQuizAttemptRow[]
): ChartPoint[] {
  const today = startOfDay(new Date())

  return Array.from({ length: 7 }).map((_, index) => {
    const current = new Date(today)
    current.setDate(today.getDate() - (6 - index))
    const key = toDayKey(current)

    const usageCount = logs.filter((log) => toDayKey(log.created_at) === key).length
    const sessionCount = sessions.filter((session) => toDayKey(session.started_at) === key).length
    const savedNotesCount = savedNotes.filter((note) => toDayKey(note.created_at) === key).length
    const quizCount = quizAttempts.filter((attempt) => toDayKey(attempt.created_at) === key).length

    return {
      label: current.toLocaleString("en-US", { weekday: "short" }),
      count: usageCount + sessionCount + savedNotesCount + quizCount,
    }
  })
}

function buildMonthlyActivity(
  logs: UsageLogRow[],
  sessions: ActivitySessionRow[],
  savedNotes: SavedNoteRow[],
  quizAttempts: SavedQuizAttemptRow[]
): ChartPoint[] {
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

    const savedNotesCount = savedNotes.filter((note) => {
      const createdAt = new Date(note.created_at)
      return createdAt.getFullYear() === year && createdAt.getMonth() === month
    }).length

    const quizCount = quizAttempts.filter((attempt) => {
      const createdAt = new Date(attempt.created_at)
      return createdAt.getFullYear() === year && createdAt.getMonth() === month
    }).length

    return {
      label: formatMonthLabel(current),
      count: usageCount + sessionCount + savedNotesCount + quizCount,
    }
  })
}

function getFeatureUsageCounts(
  logs: UsageLogRow[],
  savedNotes: SavedNoteRow[],
  quizAttempts: SavedQuizAttemptRow[]
) {
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
    if (log.feature === "study_plan") counts.planner += 1
    if (log.feature === "ai_voice") counts.ai_voice += 1
  }

  if (savedNotes.length > counts.notes) {
    counts.notes = savedNotes.length
  }

  counts.quiz = quizAttempts.length

  return counts
}

function getEngagementLevel(secondsThisWeek: number, activeDaysThisWeek: number, totalActions: number) {
  if (secondsThisWeek >= 4 * 3600 || activeDaysThisWeek >= 5 || totalActions >= 25) return "High"
  if (secondsThisWeek >= 90 * 60 || activeDaysThisWeek >= 3 || totalActions >= 10) return "Medium"
  return "Low"
}

function calculateStreaks(activityDates: string[]) {
  const uniqueDays = [...new Set(activityDates)].sort().reverse()

  if (uniqueDays.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
    }
  }

  const today = startOfDay(new Date())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let currentStreak = 0

  const firstDay = uniqueDays[0]

  if (
    firstDay === toDayKey(today) ||
    firstDay === toDayKey(yesterday)
  ) {
    currentStreak = 1

    let previousDate = new Date(firstDay)

    for (let i = 1; i < uniqueDays.length; i++) {
      const currentDate = new Date(uniqueDays[i])

      const diffDays =
        (previousDate.getTime() - currentDate.getTime()) /
        (1000 * 60 * 60 * 24)

      if (diffDays === 1) {
        currentStreak++
        previousDate = currentDate
      } else {
        break
      }
    }
  }

  let longestStreak = 1
  let running = 1

  for (let i = 1; i < uniqueDays.length; i++) {
    const previous = new Date(uniqueDays[i - 1])
    const current = new Date(uniqueDays[i])

    const diffDays =
      (previous.getTime() - current.getTime()) /
      (1000 * 60 * 60 * 24)

    if (diffDays === 1) {
      running++
      longestStreak = Math.max(longestStreak, running)
    } else {
      running = 1
    }
  }

  return {
    currentStreak,
    longestStreak,
  }
}

export async function GET() {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = await getSupabaseAdmin()

    const [
      { data: logs },
      { data: sessions },
      { data: savedNotes },
      { data: quizAttempts },
    ] = await Promise.all([
      admin
        .from("usage_logs")
        .select("feature, created_at, metadata")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      admin
        .from("user_activity_sessions")
        .select("duration_seconds, started_at, last_seen_at")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false }),
      admin
        .from("saved_notes")
        .select("id, created_at, source_title, source_type")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      admin
        .from("saved_quiz_attempts")
        .select("id, created_at, score, total_questions, percentage")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ])

    const allLogs = (logs || []) as UsageLogRow[]
    const allSessions = (sessions || []) as ActivitySessionRow[]
    const allSavedNotes = (savedNotes || []) as SavedNoteRow[]
    const allQuizAttempts = (quizAttempts || []) as SavedQuizAttemptRow[]

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const quizzesTaken = allQuizAttempts.length
    const averageQuizScore = allQuizAttempts.length
      ? Number(
        (
          allQuizAttempts.reduce((sum, attempt) => sum + Number(attempt.percentage || 0), 0) /
          allQuizAttempts.length
        ).toFixed(1)
      )
      : 0

    const bestQuizScore = allQuizAttempts.length
      ? Math.max(...allQuizAttempts.map((attempt) => Number(attempt.percentage || 0)))
      : 0

    const totalActivities = allLogs.length + allSavedNotes.length + allQuizAttempts.length
    const featureUsage = getFeatureUsageCounts(allLogs, allSavedNotes, allQuizAttempts)

    const thisWeekLogs = allLogs.filter((log) => new Date(log.created_at) >= oneWeekAgo)
    const lastWeekLogs = allLogs.filter(
      (log) => new Date(log.created_at) >= twoWeeksAgo && new Date(log.created_at) < oneWeekAgo
    )

    const thisWeekSessions = allSessions.filter((session) => new Date(session.started_at) >= oneWeekAgo)
    const lastWeekSessions = allSessions.filter(
      (session) => new Date(session.started_at) >= twoWeeksAgo && new Date(session.started_at) < oneWeekAgo
    )

    const thisWeekSavedNotes = allSavedNotes.filter((note) => new Date(note.created_at) >= oneWeekAgo)
    const lastWeekSavedNotes = allSavedNotes.filter(
      (note) => new Date(note.created_at) >= twoWeeksAgo && new Date(note.created_at) < oneWeekAgo
    )

    const thisWeekQuizAttempts = allQuizAttempts.filter((attempt) => new Date(attempt.created_at) >= oneWeekAgo)
    const lastWeekQuizAttempts = allQuizAttempts.filter(
      (attempt) => new Date(attempt.created_at) >= twoWeeksAgo && new Date(attempt.created_at) < oneWeekAgo
    )

    const thisMonthSessions = allSessions.filter((session) => new Date(session.started_at) >= currentMonthStart)
    const thisMonthLogs = allLogs.filter((log) => new Date(log.created_at) >= currentMonthStart)
    const thisMonthSavedNotes = allSavedNotes.filter((note) => new Date(note.created_at) >= currentMonthStart)
    const thisMonthQuizAttempts = allQuizAttempts.filter((attempt) => new Date(attempt.created_at) >= currentMonthStart)

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

    const weeklyActivity = buildWeeklyActivity(allLogs, allSessions, allSavedNotes, allQuizAttempts)
    const monthlyActivity = buildMonthlyActivity(allLogs, allSessions, allSavedNotes, allQuizAttempts)

    const activeDaysThisWeek = new Set([
      ...thisWeekSessions.map((session) => toDayKey(session.started_at)),
      ...thisWeekLogs.map((log) => toDayKey(log.created_at)),
      ...thisWeekSavedNotes.map((note) => toDayKey(note.created_at)),
      ...thisWeekQuizAttempts.map((attempt) => toDayKey(attempt.created_at)),
    ]).size

    const activeDaysThisMonth = new Set([
      ...thisMonthSessions.map((session) => toDayKey(session.started_at)),
      ...thisMonthLogs.map((log) => toDayKey(log.created_at)),
      ...thisMonthSavedNotes.map((note) => toDayKey(note.created_at)),
      ...thisMonthQuizAttempts.map((attempt) => toDayKey(attempt.created_at)),
    ]).size

    const activityDates = [
      ...allSessions.map((session) => toDayKey(session.started_at)),
      ...allLogs.map((log) => toDayKey(log.created_at)),
      ...allSavedNotes.map((note) => toDayKey(note.created_at)),
      ...allQuizAttempts.map((attempt) => toDayKey(attempt.created_at)),
    ]

    const { currentStreak, longestStreak } = calculateStreaks(activityDates)

    return NextResponse.json({
      learningHours: formatHours(thisWeekSeconds),
      totalLearningHours: formatHours(totalTrackedSeconds),
      trackedSecondsThisWeek: thisWeekSeconds,
      totalTrackedSeconds,
      quizzesTaken,
      averageQuizScore,
      bestQuizScore,
      totalActivities,
      weekTrend,
      thisWeekCount: thisWeekLogs.length + thisWeekSavedNotes.length + thisWeekQuizAttempts.length,
      lastWeekCount: lastWeekLogs.length + lastWeekSavedNotes.length + lastWeekQuizAttempts.length,
      activeDaysThisWeek,
      activeDaysThisMonth,
      currentStreak,
      longestStreak,
      weeklyActivity,
      monthlyActivity,
      featureUsage,
      engagementLevel: getEngagementLevel(
        thisWeekSeconds,
        activeDaysThisWeek,
        thisWeekLogs.length + thisWeekSavedNotes.length + thisWeekQuizAttempts.length
      ),
    })
  } catch (err) {
    console.error("[user/stats] Error:", err)

    return NextResponse.json(
      {
        learningHours: "0.0",
        totalLearningHours: "0.0",
        trackedSecondsThisWeek: 0,
        totalTrackedSeconds: 0,
        quizzesTaken: 0,
        averageQuizScore: 0,
        bestQuizScore: 0,
        totalActivities: 0,
        weekTrend: "0%",
        thisWeekCount: 0,
        lastWeekCount: 0,
        activeDaysThisWeek: 0,
        activeDaysThisMonth: 0,
        currentStreak: 0,
        longestStreak: 0,
        weeklyActivity: [
          { label: "Mon", count: 0 },
          { label: "Tue", count: 0 },
          { label: "Wed", count: 0 },
          { label: "Thu", count: 0 },
          { label: "Fri", count: 0 },
          { label: "Sat", count: 0 },
          { label: "Sun", count: 0 },
        ],
        monthlyActivity: [],
        featureUsage: {
          ai_tutor: 0,
          notes: 0,
          flashcards: 0,
          quiz: 0,
          planner: 0,
          ai_voice: 0,
        },
        engagementLevel: "Low",
        error: "Failed to load stats",
      },
      { status: 500 }
    )
  }
}