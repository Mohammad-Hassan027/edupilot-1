import React from "react"
import { cn } from "@/lib/utils"
import { Sparkles, Activity, ShieldAlert } from "lucide-react"

interface DifficultyBadgeProps {
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  className?: string
}

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const configs = {
    Beginner: {
      label: "Beginner",
      classes: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25 dark:bg-emerald-500/25 dark:text-emerald-400 dark:border-emerald-500/35",
      icon: Sparkles,
    },
    Intermediate: {
      label: "Intermediate",
      classes: "bg-amber-500/10 text-amber-600 border-amber-500/25 dark:bg-amber-500/25 dark:text-amber-400 dark:border-amber-500/35",
      icon: Activity,
    },
    Advanced: {
      label: "Advanced",
      classes: "bg-rose-500/10 text-rose-500 border-rose-500/25 dark:bg-rose-500/25 dark:text-rose-400 dark:border-rose-500/35",
      icon: ShieldAlert,
    },
  }

  const current = configs[difficulty] || configs.Intermediate
  const Icon = current.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-xs select-none backdrop-blur-md transition-all duration-300",
        current.classes,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 animate-pulse" />
      {current.label}
    </span>
  )
}
