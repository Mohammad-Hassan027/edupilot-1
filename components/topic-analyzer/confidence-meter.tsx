import React from "react"
import { cn } from "@/lib/utils"

interface ConfidenceMeterProps {
  score: number // 0 to 100
  className?: string
  size?: number
}

export function ConfidenceMeter({ score, className, size = 72 }: ConfidenceMeterProps) {
  const radius = size * 0.38
  const strokeWidth = size * 0.08
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const getColor = (s: number) => {
    if (s >= 85) return "stroke-primary"
    if (s >= 65) return "stroke-amber-500"
    return "stroke-rose-500"
  }

  const getTextColor = (s: number) => {
    if (s >= 85) return "text-primary"
    if (s >= 65) return "text-amber-500"
    return "text-rose-500"
  }

  return (
    <div className={cn("relative flex items-center justify-center select-none", className)} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Track circle */}
        <circle
          className="stroke-muted/40 dark:stroke-muted/20"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className={cn("transition-all duration-1000 ease-out", getColor(score))}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Center label */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className={cn("text-sm font-black tracking-tighter", getTextColor(score))}>{score}%</span>
      </div>
    </div>
  )
}
