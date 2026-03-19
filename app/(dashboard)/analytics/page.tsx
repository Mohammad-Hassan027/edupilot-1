"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Flame,
  Brain,
  Trophy,
  BookOpen,
  Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"

const studyHoursData = [
  { week: "Week 1", hours: 18 },
  { week: "Week 2", hours: 22 },
  { week: "Week 3", hours: 19 },
  { week: "Week 4", hours: 28 },
]

const quizScoresData = [
  { subject: "Math", score: 85 },
  { subject: "Physics", score: 78 },
  { subject: "Chem", score: 92 },
  { subject: "Bio", score: 88 },
]

const dailyFocusData = [
  { time: "6AM", focus: 20 },
  { time: "9AM", focus: 85 },
  { time: "12PM", focus: 65 },
  { time: "3PM", focus: 75 },
  { time: "6PM", focus: 90 },
  { time: "9PM", focus: 55 },
]

const statsCards = [
  { label: "Study Streak", value: "12 days", icon: Flame, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  { label: "Total Hours", value: "127h", icon: Clock, color: "text-primary", bgColor: "bg-primary/10" },
  { label: "Goals Met", value: "85%", icon: Target, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  { label: "AI Sessions", value: "48", icon: Brain, color: "text-violet-500", bgColor: "bg-violet-500/10" },
]

const achievements = [
  { name: "First Week", description: "Completed first week of study", earned: true },
  { name: "Quiz Master", description: "Scored 90%+ on 5 quizzes", earned: true },
  { name: "Night Owl", description: "Studied past midnight 3 times", earned: true },
  { name: "Perfect Week", description: "Met all daily goals for a week", earned: false },
  { name: "AI Explorer", description: "Used AI Tutor 50 times", earned: false },
]

export default function AnalyticsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Progress Analytics</h1>
          <p className="text-muted-foreground">Track your learning progress and insights</p>
        </div>
        <Select defaultValue="month">
          <SelectTrigger className="w-[140px] bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Study Hours Chart */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Study Hours
            </CardTitle>
            <div className="flex items-center gap-1 text-sm text-emerald-500">
              <TrendingUp className="h-4 w-4" />
              +18%
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full min-w-0">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={studyHoursData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(238.7, 83.5%, 66.7%)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(238.7, 83.5%, 66.7%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 20.2%, 65.1%)", fontSize: 12 }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(217.2, 32.6%, 11%)", border: "1px solid hsl(217.2, 32.6%, 17.5%)", borderRadius: "8px" }}
                    labelStyle={{ color: "hsl(210, 40%, 98%)" }}
                    formatter={(value: number) => [`${value} hours`, "Study Time"]}
                  />
                  <Area type="monotone" dataKey="hours" stroke="hsl(238.7, 83.5%, 66.7%)" strokeWidth={2} fill="url(#hoursGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quiz Scores */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Quiz Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full min-w-0">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={quizScoresData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 20.2%, 65.1%)", fontSize: 12 }} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(217.2, 32.6%, 11%)", border: "1px solid hsl(217.2, 32.6%, 17.5%)", borderRadius: "8px" }}
                    labelStyle={{ color: "hsl(210, 40%, 98%)" }}
                    formatter={(value: number) => [`${value}%`, "Score"]}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {quizScoresData.map((entry, index) => (
                      <Cell key={index} fill={entry.score >= 90 ? "#10b981" : entry.score >= 80 ? "hsl(238.7, 83.5%, 66.7%)" : "#f59e0b"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Focus Score */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Daily Focus Pattern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full min-w-0">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailyFocusData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "hsl(215, 20.2%, 65.1%)", fontSize: 12 }} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(217.2, 32.6%, 11%)", border: "1px solid hsl(217.2, 32.6%, 17.5%)", borderRadius: "8px" }}
                    labelStyle={{ color: "hsl(210, 40%, 98%)" }}
                    formatter={(value: number) => [`${value}%`, "Focus Level"]}
                  />
                  <Area type="monotone" dataKey="focus" stroke="#8b5cf6" strokeWidth={2} fill="url(#focusGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-muted-foreground text-center mt-2">Peak focus: 6PM - 9PM</p>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Achievements
            </CardTitle>
            <span className="text-sm text-muted-foreground">3/5 earned</span>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.name}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg",
                  achievement.earned ? "bg-primary/5" : "bg-secondary/50 opacity-60"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    achievement.earned ? "bg-primary/20" : "bg-muted"
                  )}
                >
                  <Trophy className={cn("h-5 w-5", achievement.earned ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="flex-1">
                  <p className={cn("font-medium", achievement.earned ? "text-foreground" : "text-muted-foreground")}>
                    {achievement.name}
                  </p>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                </div>
                {achievement.earned && (
                  <span className="text-xs font-medium text-primary">Earned</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
