"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronLeft, ChevronRight, Clock, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

const todaySchedule = [
  {
    time: "09:00",
    duration: "2h",
    subject: "API Design Concepts",
    topic: "REST vs GraphQL",
    color: "border-l-primary bg-primary/5",
  },
  {
    time: "11:30",
    duration: "1.5h",
    subject: "Machine Learning",
    topic: "Neural Networks Basics",
    color: "border-l-violet-500 bg-violet-500/5",
  },
  {
    time: "14:00",
    duration: "1h",
    subject: "Break",
    topic: "Rest & Recharge",
    color: "border-l-muted-foreground bg-muted/30",
  },
  {
    time: "15:30",
    duration: "2h",
    subject: "UI Design",
    topic: "Design Systems",
    color: "border-l-emerald-500 bg-emerald-500/5",
  },
]

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const currentDay = 2 // Wednesday (0-indexed)

export function StudyPlanner() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">Study Planner</CardTitle>
            <p className="text-xs text-muted-foreground">March 11, 2026</p>
          </div>
        </div>
        <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add Session
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Week Selector */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex gap-1">
            {weekDays.map((day, index) => (
              <button
                key={day}
                className={cn(
                  "flex h-10 w-10 flex-col items-center justify-center rounded-lg text-xs transition-all",
                  index === currentDay
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <span className="font-medium">{day}</span>
                <span className="text-[10px] opacity-70">{9 + index}</span>
              </button>
            ))}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Today's Schedule */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Today's Schedule</p>
          <div className="space-y-2">
            {todaySchedule.map((session, index) => (
              <div
                key={index}
                className={cn(
                  "rounded-lg border-l-4 p-3 transition-all hover:translate-x-1",
                  session.color
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">{session.subject}</p>
                    <p className="text-xs text-muted-foreground">{session.topic}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {session.time} • {session.duration}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
