export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import type { FeatureKey } from "@/types"

// Scoped to the /analytics page only. Deliberately NOT called from the main
// /dashboard data-fetching path (that page and its cards use /api/user/stats)
// so this historical/trend query never adds latency to the main dashboard.

type UsageLogRow = {
  feature: string
  created_at: string
}

// These are the three features that are actually credit-metered (see
// FeatureKey in types/index.ts and lib/credits.ts::consumeCredit). Every AI
// route that deducts a credit also calls logUsage() for the same feature, so
// usage_logs is the single source of truth for both credit deductions and
// this analytics view — no parallel tracking table.
const CREDIT_FEATURES: FeatureKey[] = ["ai_chat", "flashcards", "study_plan"]

const PERIOD_TO_DAYS: Record<string, number> = {
  week: 7,
  month: 30,
  all: 180, // bounded lookback so the query stays cheap even for old accounts
}

function toDayKey(value: string) {
  return new Date(value).toISOString().split("T")[0]
}

function formatLabel(date: Date, days: number) {
  return days > 45
    ? date.toLocaleString("en-US", { month: "short", day: "numeric" })
    : date.toLocaleString("en-US", { weekday: "short", day: "numeric" })
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const period = req.nextUrl.searchParams.get("period") ?? "month"
    const days = PERIOD_TO_DAYS[period] ?? PERIOD_TO_DAYS.month

    const since = new Date()
    since.setHours(0, 0, 0, 0)
    since.setDate(since.getDate() - (days - 1))

    const admin = await getSupabaseAdmin()

    // Single, narrow, indexed query (idx_usage_logs_user_id + created_at desc)
    // limited to the credit-metered features and the selected lookback window.
    const { data, error } = await admin
      .from("usage_logs")
      .select("feature, created_at")
      .eq("user_id", user.id)
      .in("feature", CREDIT_FEATURES)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true })

    if (error) throw error

    const logs = (data ?? []) as UsageLogRow[]

    const byDay = new Map<string, Record<FeatureKey, number>>()
    for (let i = 0; i < days; i++) {
      const d = new Date(since)
      d.setDate(since.getDate() + i)
      byDay.set(toDayKey(d.toISOString()), { ai_chat: 0, flashcards: 0, study_plan: 0 })
    }

    const totals: Record<FeatureKey, number> = { ai_chat: 0, flashcards: 0, study_plan: 0 }

    for (const log of logs) {
      const feature = log.feature as FeatureKey
      if (!CREDIT_FEATURES.includes(feature)) continue

      totals[feature] += 1

      const key = toDayKey(log.created_at)
      const bucket = byDay.get(key)
      if (bucket) bucket[feature] += 1
    }

    const trend = Array.from(byDay.entries()).map(([dateKey, counts]) => ({
      date: dateKey,
      label: formatLabel(new Date(dateKey), days),
      ai_chat: counts.ai_chat,
      flashcards: counts.flashcards,
      study_plan: counts.study_plan,
    }))

    return NextResponse.json({
      period,
      days,
      trend,
      totals,
      aggregates: {
        totalSessions: totals.ai_chat,
        decksCreated: totals.flashcards,
        plansCreated: totals.study_plan,
        totalCreditActions: totals.ai_chat + totals.flashcards + totals.study_plan,
      },
    })
  } catch (err) {
    console.error("[usage/history] Error:", err)
    return NextResponse.json(
      {
        period: "month",
        days: 30,
        trend: [],
        totals: { ai_chat: 0, flashcards: 0, study_plan: 0 },
        aggregates: { totalSessions: 0, decksCreated: 0, plansCreated: 0, totalCreditActions: 0 },
        error: "Failed to load usage history",
      },
      { status: 500 }
    )
  }
}
