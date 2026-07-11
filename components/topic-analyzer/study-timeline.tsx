import React from "react"
import { Award } from "lucide-react"

interface StudyTimelineProps {
  studyOrder: string[]
}

export function StudyTimeline({ studyOrder }: StudyTimelineProps) {
  if (studyOrder.length === 0) {
    return <p className="text-sm text-muted-foreground">No study steps provided.</p>
  }

  return (
    <div className="rounded-xl border border-border bg-card/40 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/20">
      <div className="flex items-center gap-2 mb-6">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Award className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Recommended Learning Order</h3>
      </div>
      
      <div className="relative pl-6 border-l border-border/80 dark:border-border/40 ml-3 space-y-6">
        {studyOrder.map((step, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline bullet */}
            <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-background border border-border dark:border-border/60 group-hover:border-primary transition-all duration-300 shadow-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground group-hover:bg-primary transition-all duration-300" />
            </div>
            
            {/* Timeline content */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary/80 uppercase tracking-wider">Step {idx + 1}</span>
              </div>
              <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300 leading-relaxed font-medium">
                {step}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
