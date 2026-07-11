import React from "react"
import { RefreshCcw, BookOpen, Clock, CalendarRange } from "lucide-react"

interface RevisionCardProps {
  sessions: number
}

export function RevisionCard({ sessions }: RevisionCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-blue-500/20">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
          <RefreshCcw className="h-4 w-4 text-blue-500" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Revision Schedule</h3>
      </div>
      
      <div className="flex items-center gap-4 mb-4">
        <div className="text-4xl font-extrabold text-foreground tracking-tight">{sessions}</div>
        <div className="text-sm text-muted-foreground leading-snug">
          sessions recommended to achieve mastery using spaced repetition.
        </div>
      </div>

      <div className="space-y-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span><strong>1st Review:</strong> Within 24 hours (focused on recall)</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarRange className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span><strong>2nd Review:</strong> After 3 days (focused on testing)</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span><strong>Final Review:</strong> After 7 days (long-term integration)</span>
        </div>
      </div>
    </div>
  )
}
