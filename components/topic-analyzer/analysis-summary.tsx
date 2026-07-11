import React from "react"
import { Info } from "lucide-react"

interface AnalysisSummaryProps {
  summary: string
}

export function AnalysisSummary({ summary }: AnalysisSummaryProps) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Info className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Topic Overview</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed font-medium">
        {summary}
      </p>
    </div>
  )
}
