"use client"

import { useRevisionScheduler } from "@/hooks/use-revision-scheduler"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Clock,
  CheckCircle2,
  Play,
  Sparkles,
  ChevronRight,
  AlertCircle,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { cn } from "@/lib/utils"

function getLocalDateStr() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const localDate = new Date(now.getTime() - offset * 60 * 1000)
  return localDate.toISOString().split("T")[0]
}

export function RevisionWidget() {
  const {
    revisions,
    stats,
    loading,
    markComplete,
    generateSchedule,
  } = useRevisionScheduler()

  const [completingId, setCompletingId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const activeRevisions = [...revisions.overdue, ...revisions.today]
  const completedCount = stats.completedTodayCount
  const pendingCount = activeRevisions.length
  const totalCount = completedCount + pendingCount

  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const handleQuickComplete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCompletingId(id)
    try {
      await markComplete(id)
    } finally {
      setCompletingId(null)
    }
  }

  const handleQuickGenerate = async () => {
    setGenerating(true)
    try {
      await generateSchedule()
    } finally {
      setGenerating(false)
    }
  }

  const getPriorityColor = (priority: "low" | "medium" | "high") => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/15"
      case "medium":
        return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/15"
      case "low":
      default:
        return "bg-slate-500/10 text-slate-500 hover:bg-slate-500/15"
    }
  }

  const getStageLabel = (stage: number) => {
    return `Stage ${stage}/5`
  }

  return (
    <Card className="border-border bg-card shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
            <Clock className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              Revision Scheduler
            </CardTitle>
            <p className="text-xs text-muted-foreground">Spaced repetition schedule</p>
          </div>
        </div>
        <Link href="/revision">
          <Button variant="ghost" size="sm" className="gap-1 text-primary hover:text-primary text-xs">
            View All <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {loading ? (
          <div className="space-y-3 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-6 w-full" />
            <div className="space-y-2 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2 border border-border/40 rounded-lg">
                  <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Today's Progress */}
            {totalCount > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    Completions Today
                  </span>
                  <span className="text-foreground">
                    {completedCount} / {totalCount} ({progressPercent}%)
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2 bg-secondary" />
              </div>
            )}

            {/* Revision List */}
            {activeRevisions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="font-medium text-foreground mb-1">All caught up!</p>
                <p className="text-xs text-muted-foreground max-w-[240px] mb-4">
                  No revisions are pending for today. Study new topics to trigger future schedules.
                </p>
                <Button
                  onClick={handleQuickGenerate}
                  disabled={generating}
                  size="sm"
                  className="gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {generating ? "Scanning Activity..." : "Generate AI Tasks"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[220px] pr-1">
                {activeRevisions.slice(0, 4).map((item) => {
                  const isOverdue = item.scheduled_date < getLocalDateStr()
                  const isCompleting = completingId === item.id

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "group flex items-start gap-3 p-2.5 rounded-lg border border-border bg-card/50 hover:bg-secondary/40 transition-all",
                        isOverdue && "border-l-4 border-l-red-500 bg-red-500/[0.01]"
                      )}
                    >
                      <button
                        onClick={(e) => handleQuickComplete(item.id, e)}
                        disabled={isCompleting}
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-muted-foreground/40 text-transparent transition-all hover:border-primary hover:bg-primary/10",
                          isCompleting && "animate-pulse cursor-wait"
                        )}
                        title="Mark complete"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-semibold text-foreground truncate capitalize">
                            {item.topic}
                          </p>
                          {isOverdue && (
                            <span className="text-[10px] font-semibold text-red-500 flex items-center gap-0.5 shrink-0 bg-red-500/10 px-1.5 py-0.5 rounded">
                              <AlertCircle className="h-2.5 w-2.5" />
                              Overdue
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {item.subject} • {item.estimated_minutes}m session
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge
                          variant="secondary"
                          className={cn("text-[9px] font-medium px-1.5 py-0.5", getPriorityColor(item.priority))}
                        >
                          {item.priority}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground/80 font-medium">
                          {getStageLabel(item.revision_stage)}
                        </span>
                      </div>
                    </div>
                  )
                })}

                {activeRevisions.length > 4 && (
                  <Link href="/revision">
                    <p className="text-xs text-center text-primary font-medium hover:underline pt-1 cursor-pointer">
                      + {activeRevisions.length - 4} more pending revisions. View all.
                    </p>
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
