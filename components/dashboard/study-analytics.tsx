"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { TrendingUp, Clock, Target, Flame } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface StatsData {
  streak: number
  learningHours: string
  weekTrend: string
  activeDaysThisWeek: number
  weeklyActivity: Array<{ label: string; count: number }>
}

export function StudyAnalytics() {
  const [data, setData] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/user/stats")
      .then((response) => (response.ok ? response.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setIsLoading(false))
  }, [])

  const stats = data
    ? [
        { label: "Study Streak", value: `${data.streak} days`, icon: Flame, color: "text-orange-500" },
        { label: "This Week", value: `${data.learningHours} hrs`, icon: Clock, color: "text-primary" },
        { label: "vs Last Week", value: data.weekTrend, icon: TrendingUp, color: "text-violet-500" },
        {
          label: "Active Days",
          value: `${data.activeDaysThisWeek} days`,
          icon: Target,
          color: "text-emerald-500",
        },
      ]
    : []

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground">Study Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((item) => (
                <Skeleton key={item} className="h-16 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-[140px]" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-border bg-secondary/50 p-3">
                  <div className="flex items-center gap-2">
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className="mt-1 text-xl font-bold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Weekly Activity</p>
              {data?.weeklyActivity && data.weeklyActivity.some((day) => day.count > 0) ? (
                <div className="h-[140px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={data.weeklyActivity} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <defs>
                        <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                        formatter={(value: number) => [`${value} actions`, "Activity"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#actGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[140px] flex items-center justify-center text-center">
                  <div>
                    <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                    <p className="text-sm text-muted-foreground">No activity this week yet.</p>
                    <p className="text-xs text-muted-foreground">Start using AI features to track your progress!</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
