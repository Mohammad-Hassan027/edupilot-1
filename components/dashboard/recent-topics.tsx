"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, MessageSquareText, Layers, HelpCircle, Clock, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

interface ActivityEntry {
  id: string
  feature: string
  action: string
  metadata: Record<string, unknown> | null
  created_at: string
}

const featureConfig: Record<string, { icon: typeof BookOpen; label: string; color: string; href: string }> = {
  ai_chat:    { icon: MessageSquareText, label: "AI Tutor",    color: "text-primary",       href: "/ai-tutor"   },
  flashcards: { icon: Layers,            label: "Flashcards",  color: "text-violet-500",    href: "/flashcards" },
  quiz:       { icon: HelpCircle,        label: "Quiz",        color: "text-amber-500",     href: "/quiz"       },
  notes:      { icon: BookOpen,          label: "Notes",       color: "text-emerald-500",   href: "/notes"      },
  study_plan: { icon: Sparkles,          label: "Study Plan",  color: "text-pink-500",      href: "/planner"    },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function RecentTopics() {
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/user/recent-activity")
      .then((r) => r.json())
      .then((d) => setActivity(d.activity || []))
      .catch(() => setActivity([]))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Recent Learning Topics
          </CardTitle>
          <Link href="/ai-tutor">
            <Button variant="ghost" size="sm" className="gap-1 text-primary hover:text-primary text-xs">
              Continue <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <p className="font-medium text-foreground mb-1">No activity yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Your learning history will appear here once you start using EduPilot.
            </p>
            <Button asChild size="sm" className="gap-2">
              <Link href="/ai-tutor">
                <MessageSquareText className="h-4 w-4" />
                Start with AI Tutor
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {activity.map((entry) => {
              const cfg = featureConfig[entry.feature] ?? featureConfig.ai_chat
              const Icon = cfg.icon
              const meta = entry.metadata as Record<string, unknown> | null
              const topic =
                (meta?.topic as string) ||
                (entry.action === "question_asked" ? "AI Chat Session" : entry.action.replace(/_/g, " "))
              return (
                <Link href={cfg.href} key={entry.id}>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary transition-colors group cursor-pointer">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary group-hover:bg-background transition-colors shrink-0">
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate capitalize">{topic}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{timeAgo(entry.created_at)}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">{cfg.label}</Badge>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
