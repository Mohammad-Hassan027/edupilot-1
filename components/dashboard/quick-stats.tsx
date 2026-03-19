"use client"

import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Clock, Trophy, Flame, Target, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const stats = [
  {
    label: "Learning Streak",
    value: "12",
    unit: "days",
    change: "Personal best!",
    icon: Flame,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    label: "Learning Hours",
    value: "27.1",
    unit: "hrs",
    change: "+18% vs last week",
    icon: Clock,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    label: "Goals Completed",
    value: "85",
    unit: "%",
    change: "5 of 6 goals",
    icon: Target,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    label: "Quizzes Taken",
    value: "24",
    unit: "tests",
    change: "Avg score: 82%",
    icon: HelpCircle,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
]

export function QuickStats() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="border-border bg-card transition-all hover:shadow-lg hover:border-primary/20"
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", stat.bgColor)}>
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
