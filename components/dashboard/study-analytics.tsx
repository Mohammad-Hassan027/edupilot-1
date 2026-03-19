"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { TrendingUp, Clock, Target, Flame } from "lucide-react"

const weeklyData = [
  { day: "Mon", hours: 2.5 },
  { day: "Tue", hours: 3.8 },
  { day: "Wed", hours: 4.2 },
  { day: "Thu", hours: 3.1 },
  { day: "Fri", hours: 5.5 },
  { day: "Sat", hours: 4.8 },
  { day: "Sun", hours: 3.2 },
]

const stats = [
  { label: "Study Streak", value: "12 days", icon: Flame, color: "text-orange-500" },
  { label: "This Week", value: "27.1 hrs", icon: Clock, color: "text-primary" },
  { label: "Goals Met", value: "85%", icon: Target, color: "text-emerald-500" },
  { label: "Improvement", value: "+18%", icon: TrendingUp, color: "text-violet-500" },
]

export function StudyAnalytics() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground">Study Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-secondary/50 p-3"
            >
              <div className="flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="mt-1 text-xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Weekly Study Hours</p>
          <div className="h-[140px] w-full min-w-0">
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={weeklyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(238.7, 83.5%, 66.7%)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(238.7, 83.5%, 66.7%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(215, 20.2%, 65.1%)", fontSize: 11 }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(217.2, 32.6%, 11%)",
                    border: "1px solid hsl(217.2, 32.6%, 17.5%)",
                    borderRadius: "8px",
                    color: "hsl(210, 40%, 98%)",
                  }}
                  labelStyle={{ color: "hsl(215, 20.2%, 65.1%)" }}
                  formatter={(value: number) => [`${value} hrs`, "Study Time"]}
                />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="hsl(238.7, 83.5%, 66.7%)"
                  strokeWidth={2}
                  fill="url(#studyGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
