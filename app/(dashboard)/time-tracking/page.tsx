"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Play, 
  Pause, 
  Square, 
  Clock,
  Calendar,
  TrendingUp,
  Target,
  RotateCcw
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Session {
  id: string
  subject: string
  duration: number // in seconds
  date: string
}

const recentSessions: Session[] = [
  { id: "1", subject: "Mathematics", duration: 7200, date: "Today" },
  { id: "2", subject: "Physics", duration: 5400, date: "Today" },
  { id: "3", subject: "Chemistry", duration: 3600, date: "Yesterday" },
  { id: "4", subject: "Biology", duration: 4500, date: "Yesterday" },
]

const weeklyStats = [
  { day: "Mon", hours: 2.5 },
  { day: "Tue", hours: 3.8 },
  { day: "Wed", hours: 4.2 },
  { day: "Thu", hours: 3.1 },
  { day: "Fri", hours: 5.5 },
  { day: "Sat", hours: 4.8 },
  { day: "Sun", hours: 3.2 },
]

const subjectColors: Record<string, string> = {
  Mathematics: "bg-primary text-primary-foreground",
  Physics: "bg-violet-500 text-white",
  Chemistry: "bg-emerald-500 text-white",
  Biology: "bg-orange-500 text-white",
}

function formatTime(seconds: number) {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

function formatDuration(seconds: number) {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hrs > 0) {
    return `${hrs}h ${mins}m`
  }
  return `${mins}m`
}

export default function TimeTrackingPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [time, setTime] = useState(0)
  const [selectedSubject, setSelectedSubject] = useState("Mathematics")
  const [sessions] = useState<Session[]>(recentSessions)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isRunning) {
      interval = setInterval(() => {
        setTime((t) => t + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  const handleStart = () => setIsRunning(true)
  const handlePause = () => setIsRunning(false)
  const handleStop = () => {
    setIsRunning(false)
    setTime(0)
  }
  const handleReset = () => setTime(0)

  const todayTotal = sessions.filter((s) => s.date === "Today").reduce((acc, s) => acc + s.duration, 0)
  const weeklyTotal = weeklyStats.reduce((acc, s) => acc + s.hours, 0)
  const maxHours = Math.max(...weeklyStats.map((s) => s.hours))

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Time Tracking</h1>
        <p className="text-muted-foreground">Track and monitor your study sessions</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timer */}
        <Card className="lg:col-span-2 border-border bg-card">
          <CardContent className="p-8">
            <div className="flex flex-col items-center space-y-8">
              {/* Subject Selector */}
              <div className="w-full max-w-xs">
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Physics">Physics</SelectItem>
                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                    <SelectItem value="Biology">Biology</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Timer Display */}
              <div className="relative">
                <div className="flex h-64 w-64 items-center justify-center rounded-full border-8 border-secondary">
                  <div className="text-center">
                    <p className="text-5xl font-bold font-mono text-foreground">{formatTime(time)}</p>
                    <p className="text-sm text-muted-foreground mt-2">{selectedSubject}</p>
                  </div>
                </div>
                {isRunning && (
                  <div className="absolute inset-0 rounded-full border-8 border-primary border-t-transparent animate-spin-slow" />
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                {!isRunning ? (
                  <Button size="lg" className="h-14 w-14 rounded-full" onClick={handleStart}>
                    <Play className="h-6 w-6" />
                  </Button>
                ) : (
                  <Button size="lg" variant="secondary" className="h-14 w-14 rounded-full" onClick={handlePause}>
                    <Pause className="h-6 w-6" />
                  </Button>
                )}
                <Button size="lg" variant="destructive" className="h-14 w-14 rounded-full" onClick={handleStop}>
                  <Square className="h-6 w-6" />
                </Button>
                <Button size="lg" variant="outline" className="h-14 w-14 rounded-full" onClick={handleReset}>
                  <RotateCcw className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Sidebar */}
        <div className="space-y-4">
          {/* Today Stats */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                {"Today's Progress"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{formatDuration(todayTotal + time)}</p>
              <p className="text-sm text-muted-foreground">Study time today</p>
            </CardContent>
          </Card>

          {/* Weekly Stats */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-3xl font-bold text-foreground">{weeklyTotal.toFixed(1)}h</p>
                <p className="text-sm text-muted-foreground">Total study time</p>
              </div>
              <div className="flex items-end justify-between gap-1 h-20">
                {weeklyStats.map((stat) => (
                  <div key={stat.day} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-primary/20 rounded-t"
                      style={{ height: `${(stat.hours / maxHours) * 100}%` }}
                    >
                      <div
                        className="w-full bg-primary rounded-t"
                        style={{ height: "100%" }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{stat.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Goal */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Daily Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{formatDuration(todayTotal + time)} / 4h</span>
                <span className="text-sm font-medium text-foreground">
                  {Math.min(100, Math.round(((todayTotal + time) / 14400) * 100))}%
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, ((todayTotal + time) / 14400) * 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Sessions */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Recent Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium",
                    subjectColors[session.subject] || "bg-muted text-muted-foreground"
                  )}
                >
                  {session.subject.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{session.subject}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDuration(session.duration)} • {session.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
