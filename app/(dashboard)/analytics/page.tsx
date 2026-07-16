"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import {
  TrendingUp, Clock, Target, Flame, Brain, Trophy, BookOpen, Calendar, MessageSquareText, Layers, ListChecks
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/use-user"

interface StatsData {
  streak: number
  learningHours: string
  quizzesTaken: number
  aiChats: number
  flashcardSessions: number
  weekTrend: string
  weeklyActivity: Array<{ day: string; count: number }>
}

// Historical, per-feature-type usage trend + aggregates. Sourced from the same
// usage_logs table that lib/credits.ts writes to on every credit deduction
// (see app/api/usage/history/route.ts) rather than a separate pipeline. This
// is fetched independently of /api/user/stats so it never adds load to the
// main /dashboard page.
interface UsageHistoryPoint {
  date: string
  label: string
  ai_chat: number
  flashcards: number
  study_plan: number
}

interface UsageHistoryData {
  trend: UsageHistoryPoint[]
  aggregates: {
    totalSessions: number
    decksCreated: number
    plansCreated: number
    totalCreditActions: number
  }
}

export default function AnalyticsPage() {
  const { credits, subscription } = useUser()
  const [stats, setStats]     = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod]   = useState("week")
  const [usageHistory, setUsageHistory] = useState<UsageHistoryData | null>(null)
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)

  useEffect(() => {
    fetch("/api/user/stats")
      .then(r => r.json())
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    setIsHistoryLoading(true)
    fetch(`/api/usage/history?period=${period}`)
      .then(r => r.json())
      .then(setUsageHistory)
      .catch(() => setUsageHistory(null))
      .finally(() => setIsHistoryLoading(false))
  }, [period])

  const isTrial = subscription?.trial_active === true

  const statsCards = stats ? [
    { label: "Study Streak",  value: `${stats.streak} days`,      icon: Flame,    color: "text-orange-500", bgColor: "bg-orange-500/10" },
    { label: "Learning Hours",value: `${stats.learningHours}h`,   icon: Clock,    color: "text-primary",    bgColor: "bg-primary/10"    },
    { label: "Quizzes Taken", value: String(stats.quizzesTaken),  icon: Target,   color: "text-emerald-500",bgColor: "bg-emerald-500/10"},
    { label: "AI Sessions",   value: String(stats.aiChats),       icon: Brain,    color: "text-violet-500", bgColor: "bg-violet-500/10" },
  ] : []

  const creditsData = credits ? [
    { subject: "AI Chats",   score: credits.ai_chat_remaining,    fill: "hsl(var(--primary))" },
    { subject: "Flashcards", score: credits.flashcards_remaining, fill: "hsl(var(--chart-2,142 71% 45%))" },
    { subject: "Study Plans",score: credits.study_plan_remaining, fill: "hsl(var(--chart-3,199 89% 48%))" },
  ] : []

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Learning Analytics</h1>
          <p className="text-muted-foreground">Track your study progress and performance</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px] bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => (
            <Card key={stat.label} className="border-border bg-card">
              <CardContent className="flex items-center gap-4 p-4">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", stat.bgColor)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Activity Chart */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px]" />
            ) : stats?.weeklyActivity && stats.weeklyActivity.some(d => d.count > 0) ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.weeklyActivity} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#actGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-sm text-muted-foreground">No activity this week yet</p>
                  <p className="text-xs text-muted-foreground">Start using AI features to see your stats</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credits Remaining Chart */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4 text-primary" />
              Credits Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px]" />
            ) : isTrial ? (
              <div className="h-[200px] flex items-center justify-center">
                <div className="text-center">
                  <Trophy className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-emerald-500">Trial Active</p>
                  <p className="text-sm text-muted-foreground">Unlimited access enabled</p>
                </div>
              </div>
            ) : credits ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={creditsData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <XAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Usage by Feature Type - aggregate stats sourced from usage_logs (same
          source lib/credits.ts writes to on every credit deduction) */}
      {isHistoryLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total AI Sessions", value: usageHistory?.aggregates.totalSessions ?? 0, icon: MessageSquareText, color: "text-violet-500", bgColor: "bg-violet-500/10" },
            { label: "Decks Created",     value: usageHistory?.aggregates.decksCreated ?? 0,   icon: Layers,           color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
            { label: "Plans Created",     value: usageHistory?.aggregates.plansCreated ?? 0,   icon: ListChecks,       color: "text-primary",     bgColor: "bg-primary/10" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border bg-card">
              <CardContent className="flex items-center gap-4 p-4">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", stat.bgColor)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Credit Usage Trend, segmented by feature type */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            Usage Trend by Feature
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isHistoryLoading ? (
            <Skeleton className="h-[260px]" />
          ) : usageHistory?.trend && usageHistory.trend.some(d => d.ai_chat + d.flashcards + d.study_plan > 0) ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usageHistory.trend} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} minTickGap={20} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="ai_chat" name="AI Chats" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="flashcards" name="Flashcards" stroke="hsl(var(--chart-2,142 71% 45%))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="study_plan" name="Study Plans" stroke="hsl(var(--chart-3,199 89% 48%))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[260px] flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">No usage recorded for this period yet</p>
                <p className="text-xs text-muted-foreground">Chats, flashcard sets, and study plans will show up here over time</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-primary" />
            Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total AI Chats",       value: stats?.aiChats ?? 0,             icon: Brain   },
                { label: "Quizzes Completed",    value: stats?.quizzesTaken ?? 0,         icon: Target  },
                { label: "Flashcard Sessions",   value: stats?.flashcardSessions ?? 0,   icon: BookOpen},
                { label: "Days Active",          value: stats?.streak ?? 0,              icon: Flame   },
              ].map(item => (
                <div key={item.label} className="rounded-xl border border-border bg-secondary/50 p-4 text-center">
                  <item.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
