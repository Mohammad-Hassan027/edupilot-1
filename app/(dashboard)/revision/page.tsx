"use client"

import { useState } from "react"
import { useRevisionScheduler } from "@/hooks/use-revision-scheduler"
import { RevisionDetailModal } from "@/components/revision/revision-detail-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Clock,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  Bookmark,
  Bell,
  Flame,
  CheckCircle,
  FolderOpen,
  ArrowUpDown,
  Search,
  TrendingUp,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { RevisionSchedule } from "@/types"

function getLocalDateStr() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const localDate = new Date(now.getTime() - offset * 60 * 1000)
  return localDate.toISOString().split("T")[0]
}

export default function RevisionPage() {
  const {
    revisions,
    stats,
    loading,
    generateSchedule,
    markComplete,
    deleteRevisionTask,
    updateNotes,
    notificationStatus,
    requestNotificationPermission,
  } = useRevisionScheduler()

  const [selectedRevision, setSelectedRevision] = useState<RevisionSchedule | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const [activeTab, setActiveTab] = useState<"today" | "overdue" | "upcoming" | "completed">("today")

  const handleOpenDetail = (revision: RevisionSchedule) => {
    setSelectedRevision(revision)
    setIsModalOpen(true)
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
        return "bg-red-500/10 text-red-500 border border-red-500/20"
      case "medium":
        return "bg-amber-500/10 text-amber-500 border border-amber-500/20"
      case "low":
      default:
        return "bg-slate-500/10 text-slate-500 border border-slate-500/20"
    }
  }

  const getStageBadge = (stage: number) => {
    return (
      <Badge variant="outline" className="text-[10px] font-semibold bg-secondary/80 text-foreground border-border">
        Stage {stage}/5
      </Badge>
    )
  }

  const filterAndSearch = (list: RevisionSchedule[]) => {
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase().trim()
    return list.filter(
      (r) =>
        r.topic.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q)
    )
  }

  const activeList = filterAndSearch(revisions[activeTab])

  const totalCompletions = stats.completedCount
  const pendingCount = stats.pendingCount
  const completionRate =
    totalCompletions + pendingCount > 0
      ? Math.round((totalCompletions / (totalCompletions + pendingCount)) * 100)
      : 0

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            AI Revision Scheduler
          </h1>
          <p className="text-muted-foreground text-sm">
            Retain what you learn using spaced repetition and AI-guided reminders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Notification Quick Setting */}
          {notificationStatus !== "unsupported" && (
            <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-lg border border-border/40 text-xs">
              <Bell className={cn("h-4 w-4", notificationStatus === "granted" ? "text-emerald-500" : "text-muted-foreground")} />
              <span className="text-muted-foreground font-medium">Browser Reminders</span>
              <Switch
                checked={notificationStatus === "granted"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    void requestNotificationPermission()
                  }
                }}
                disabled={notificationStatus === "granted" || notificationStatus === "denied"}
              />
            </div>
          )}

          <Button
            onClick={handleQuickGenerate}
            disabled={generating}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/95 transition-all"
          >
            <Sparkles className={cn("h-4 w-4", generating && "animate-spin")} />
            {generating ? "Scanning Study History..." : "Generate AI Revisions"}
          </Button>
        </div>
      </div>

      {/* Stats Cards Dashboard */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {/* Streak Stats */}
        <Card className="border-border bg-gradient-to-br from-orange-500/[0.03] to-red-500/[0.03] hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Revision Streak</p>
              <h3 className="text-2xl font-bold text-orange-500 flex items-baseline gap-1">
                {stats.streakCount}
                <span className="text-xs font-normal text-muted-foreground">days</span>
              </h3>
            </div>
            <div className="h-10 w-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        {/* Completed Today Stats */}
        <Card className="border-border bg-gradient-to-br from-emerald-500/[0.03] to-teal-500/[0.03] hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Completed Today</p>
              <h3 className="text-2xl font-bold text-emerald-500">{stats.completedTodayCount}</h3>
            </div>
            <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Revisions Stats */}
        <Card className="border-border bg-gradient-to-br from-blue-500/[0.03] to-sky-500/[0.03] hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Pending Revisions</p>
              <h3 className="text-2xl font-bold text-blue-500">{stats.pendingCount}</h3>
            </div>
            <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate Stats */}
        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1 flex-1 pr-2">
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Completion Rate</p>
              <h3 className="text-2xl font-bold text-foreground mb-1">{completionRate}%</h3>
              <Progress value={completionRate} className="h-1.5 w-full bg-secondary" />
            </div>
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as any)}
            className="w-full md:w-auto"
          >
            <TabsList className="grid grid-cols-4 bg-secondary">
              <TabsTrigger value="today" className="text-xs relative">
                Today
                {revisions.today.length > 0 && (
                  <span className="ml-1.5 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-bold">
                    {revisions.today.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="overdue" className="text-xs">
                Overdue
                {revisions.overdue.length > 0 && (
                  <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-bold">
                    {revisions.overdue.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="text-xs">
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs">
                Completed
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search revisions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary border-border text-sm placeholder:text-muted-foreground"
            />
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-2 p-4 border border-border/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-5 w-1/3" />
                  </div>
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : activeList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center mb-4 border border-border/40">
                <FolderOpen className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <h3 className="font-semibold text-foreground text-base">No tasks found</h3>
              <p className="text-muted-foreground text-sm max-w-sm mt-1">
                {searchQuery.trim()
                  ? "No revisions match your current search terms."
                  : activeTab === "today"
                  ? "No revisions scheduled for today! Generate tasks using the button above."
                  : activeTab === "overdue"
                  ? "Great job! You have no overdue revision schedules."
                  : activeTab === "upcoming"
                  ? "No upcoming revision tasks. Your schedule will expand as you complete current stages."
                  : "You haven't completed any revision cycles yet. Keep studying!"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeList.map((item) => {
                const isOverdue = item.scheduled_date < getLocalDateStr() && item.status === "pending"

                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenDetail(item)}
                    className={cn(
                      "group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card hover:bg-secondary/40 transition-all cursor-pointer relative overflow-hidden",
                      isOverdue && "border-l-4 border-l-red-500"
                    )}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      {item.status === "pending" ? (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            await markComplete(item.id)
                          }}
                          className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-muted-foreground/40 text-transparent transition-all hover:border-primary hover:bg-primary/10"
                          title="Mark complete"
                        >
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        </button>
                      ) : (
                        <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shrink-0">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-semibold text-foreground capitalize leading-snug">
                            {item.topic}
                          </h4>
                          {isOverdue && (
                            <span className="text-[9px] font-bold text-red-500 flex items-center gap-0.5 bg-red-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 border border-red-500/10">
                              <AlertCircle className="h-2.5 w-2.5" />
                              Overdue
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-foreground/80">{item.subject}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {item.status === "completed"
                              ? `Completed ${item.completed_at?.split("T")[0]}`
                              : `Due ${item.scheduled_date}`}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.estimated_minutes}m session
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      <div className="flex flex-col sm:items-end gap-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={cn("text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5", getPriorityColor(item.priority))}>
                            {item.priority}
                          </Badge>
                          {getStageBadge(item.revision_stage)}
                        </div>
                      </div>

                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (confirm("Are you sure you want to delete this task?")) {
                            await deleteRevisionTask(item.id)
                          }
                        }}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-secondary/60 transition-colors shrink-0"
                        title="Delete task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revision Detail Modal */}
      <RevisionDetailModal
        revision={selectedRevision}
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedRevision(null)
        }}
        onMarkComplete={markComplete}
        onSaveNotes={updateNotes}
      />
    </div>
  )
}
