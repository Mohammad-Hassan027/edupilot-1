import React from "react"
import { Lightbulb } from "lucide-react"

interface TipsCardProps {
  tips: string[]
}

export function TipsCard({ tips }: TipsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/20">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
          <Lightbulb className="h-4 w-4 text-amber-500" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Study & Prep Tips</h3>
      </div>
      {tips.length === 0 ? (
        <p className="text-xs text-muted-foreground">No specific preparation tips generated.</p>
      ) : (
        <ul className="space-y-3">
          {tips.map((tip, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
