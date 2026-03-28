"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, HelpCircle, Layers, MessageSquareText, Mic } from "lucide-react"

interface StatsResponse {
  featureUsage: {
    ai_tutor: number
    notes: number
    flashcards: number
    quiz: number
    planner: number
    ai_voice: number
  }
}

const usageItems = [
  { key: "ai_tutor", label: "AI Tutor", icon: MessageSquareText },
  { key: "notes", label: "Notes", icon: FileText },
  { key: "flashcards", label: "Flashcards", icon: Layers },
  { key: "quiz", label: "Quiz", icon: HelpCircle },
  { key: "planner", label: "AI Planner", icon: Calendar },
  { key: "ai_voice", label: "AI Voice", icon: Mic },
] as const

export function FeatureUsageCard() {
  const [data, setData] = useState<StatsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/user/stats")
      .then((response) => (response.ok ? response.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground">Feature Usage</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {usageItems.map((item) => {
              const Icon = item.icon
              const count = data?.featureUsage?.[item.key] ?? 0
              return (
                <div key={item.key} className="rounded-xl border border-border bg-secondary/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background border border-border">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{item.label}</p>
                        <p className="text-xs text-muted-foreground">Tracked per user</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-sm font-semibold">
                      {count}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}