"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, Flame, HelpCircle, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

interface Stats {
  streak: number
  learningHours: string
  quizzesTaken: number
  totalActivities: number
  weekTrend: string
  activeDaysThisMonth: number
}

export function QuickStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/user/stats")
      .then((response) => (response.ok ? response.json() : null))
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <Card key={item} className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-4">
              <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: "Learning Streak",
      value: String(stats?.streak ?? 0),
      unit: "days",
      change:
        (stats?.streak ?? 0) >= 7 ? "🔥 Keep it up!" : (stats?.streak ?? 0) > 0 ? "Going strong!" : "Start today!",
      icon: Flame,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      label: "Learning Hours",
      value: stats?.learningHours ?? "0.0",
      unit: "hrs",
      change: `${stats?.weekTrend ?? "0%"} vs last week`,
      icon: Clock,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Monthly Activity",
      value: String(stats?.totalActivities ?? 0),
      unit: "actions",
      change: `${stats?.activeDaysThisMonth ?? 0} active days this month`,
      icon: Activity,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Quizzes Taken",
      value: String(stats?.quizzesTaken ?? 0),
      unit: "tests",
      change: (stats?.quizzesTaken ?? 0) > 0 ? `${stats?.quizzesTaken ?? 0} total` : "Try a quiz!",
      icon: HelpCircle,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((stat) => (
        <Card
          key={stat.label}
          className="border-border bg-card transition-all hover:shadow-lg hover:border-primary/20"
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl shrink-0", stat.bgColor)}>
              <stat.icon className={cn("h-6 w-6", stat.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                {stat.unit && <span className="text-sm text-muted-foreground">{stat.unit}</span>}
              </div>
              <p className="text-sm text-muted-foreground truncate">{stat.label}</p>
              <p className={cn("text-xs", stat.color)}>{stat.change}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
