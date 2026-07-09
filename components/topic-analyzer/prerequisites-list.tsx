import React from "react"
import { BookOpen, GitMerge } from "lucide-react"

interface PrerequisitesListProps {
  prerequisites: string[]
  relatedConcepts: string[]
}

export function PrerequisitesList({ prerequisites, relatedConcepts }: PrerequisitesListProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Prerequisites Card */}
      <div className="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-primary/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Prerequisites</h3>
        </div>
        {prerequisites.length === 0 ? (
          <p className="text-xs text-muted-foreground">No prior prerequisites required. Ready for beginners!</p>
        ) : (
          <ul className="space-y-2">
            {prerequisites.map((req, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Related Concepts Card */}
      <div className="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-violet-500/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
            <GitMerge className="h-4 w-4 text-violet-500" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Related Concepts</h3>
        </div>
        {relatedConcepts.length === 0 ? (
          <p className="text-xs text-muted-foreground">No specific related concepts found.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {relatedConcepts.map((concept, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground border border-border/50 hover:border-violet-500/30 transition-colors"
              >
                {concept}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
