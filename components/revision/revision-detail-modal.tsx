"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Bookmark,
  ChevronRight,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { RevisionSchedule } from "@/types"

interface Props {
  revision: RevisionSchedule | null
  open: boolean
  onClose: () => void
  onMarkComplete: (id: string) => Promise<void>
  onSaveNotes: (id: string, notes: string | null) => Promise<void>
}

const STAGES = [1, 2, 3, 4, 5]
const STAGE_INTERVALS = ["Day 1", "Day 3", "Day 7", "Day 14", "Day 30"]

export function RevisionDetailModal({
  revision,
  open,
  onClose,
  onMarkComplete,
  onSaveNotes,
}: Props) {
  const [notes, setNotes] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    if (revision) {
      setNotes(revision.notes || "")
    }
  }, [revision])

  if (!revision) return null

  const isPending = revision.status === "pending"

  const handleMarkComplete = async () => {
    setCompleting(true)
    try {
      await onMarkComplete(revision.id)
      onClose()
    } finally {
      setCompleting(false)
    }
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      await onSaveNotes(revision.id, notes.trim() ? notes.trim() : null)
    } finally {
      setSavingNotes(false)
    }
  }

  const getPriorityColor = (priority: "low" | "medium" | "high") => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-500"
      case "medium":
        return "bg-amber-500/10 text-amber-500"
      case "low":
      default:
        return "bg-slate-500/10 text-slate-500"
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="bg-card border-border max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader className="pb-2 border-b border-border/40">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="secondary" className="capitalize text-[10px] font-semibold bg-primary/10 text-primary">
              {revision.subject}
            </Badge>
            <Badge variant="secondary" className={cn("capitalize text-[10px] font-semibold", getPriorityColor(revision.priority))}>
              {revision.priority} Priority
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-medium bg-secondary text-foreground">
              Stage {revision.revision_stage}/5
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold text-foreground capitalize tracking-tight flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary shrink-0" />
            {revision.topic}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary/40 p-3 rounded-lg border border-border/20 flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">First Studied</span>
              <span className="text-sm font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {revision.study_date}
              </span>
            </div>

            <div className="bg-secondary/40 p-3 rounded-lg border border-border/20 flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                {isPending ? "Next Scheduled" : "Completed At"}
              </span>
              <span className="text-sm font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {isPending ? revision.scheduled_date : revision.completed_at?.split("T")[0] || revision.scheduled_date}
              </span>
            </div>
          </div>

          {/* Revision Spaced Repetition Stages Tracker */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Spaced Repetition Stages</Label>
            <div className="bg-secondary/20 p-4 border border-border/30 rounded-lg flex items-center justify-between">
              {STAGES.map((stage) => {
                const isCurrent = revision.revision_stage === stage
                const isCompletedStage = revision.revision_stage > stage || (!isPending && isCurrent)
                const isUpcomingStage = revision.revision_stage < stage

                return (
                  <div key={stage} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center relative">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full border flex items-center justify-center text-xs font-semibold z-10 transition-all",
                          isCurrent
                            ? isPending
                              ? "border-primary bg-primary/20 text-primary shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse"
                              : "border-emerald-500 bg-emerald-500/20 text-emerald-500"
                            : isCompletedStage
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-border/80 bg-secondary text-muted-foreground"
                        )}
                      >
                        {isCompletedStage ? <CheckCircle2 className="h-4 w-4" /> : stage}
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground mt-1 shrink-0">
                        {STAGE_INTERVALS[stage - 1]}
                      </span>
                    </div>
                    {stage < 5 && (
                      <div
                        className={cn(
                          "flex-1 h-0.5 mx-2 -mt-4 transition-all",
                          isCompletedStage ? "bg-emerald-500" : "bg-border/60"
                        )}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Session Detail */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider">Session Details</span>
              <span className="flex items-center gap-1 font-medium text-foreground bg-secondary px-2 py-0.5 rounded">
                <Clock className="h-3 w-3 text-primary" />
                {revision.estimated_minutes} min study target
              </span>
            </div>
          </div>

          {/* Notes and Revision Logs Section */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" />
              Notes & Revision Logs
            </Label>
            <Textarea
              id="notes"
              placeholder="Record concepts reviewed, key terms, logic, or topics you struggled with..."
              className="bg-secondary/40 border-border min-h-[120px] text-sm text-foreground focus:ring-primary focus:border-primary"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex justify-end pt-1">
              <Button
                onClick={handleSaveNotes}
                disabled={savingNotes || (revision.notes || "") === notes.trim()}
                size="sm"
                variant="outline"
                className="text-xs h-8 hover:bg-secondary"
              >
                {savingNotes ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          {isPending && (
            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleMarkComplete}
                disabled={completing}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-2 h-11"
              >
                <CheckCircle2 className="h-5 w-5" />
                {completing ? "Updating..." : "Mark Completed"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
