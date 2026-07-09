import React from "react";
import { Progress } from "@/components/ui/progress";

interface GoalProgressProps {
  current: number;
  target: number;
  className?: string;
}

export function GoalProgress({ current, target, className = "" }: GoalProgressProps) {
  const percent = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground font-medium">
          Progress: <span className="text-foreground font-bold">{current}</span> / <span className="text-muted-foreground">{target}</span>
        </span>
        <span className="text-primary font-bold">{percent}%</span>
      </div>
      <Progress value={percent} className="h-2 w-full bg-secondary text-primary" />
    </div>
  );
}
