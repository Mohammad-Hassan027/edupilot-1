import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Sparkles, Star } from "lucide-react";

interface LevelCardProps {
  level: number;
}

// Custom title ranking system based on level
function getLevelTitle(level: number): string {
  if (level >= 25) return "EduPilot Supreme Grandmaster";
  if (level >= 15) return "Master Scholar";
  if (level >= 8) return "Advanced Learner";
  if (level >= 4) return "Active Learner";
  return "Novice Scholar";
}

export function LevelCard({ level }: LevelCardProps) {
  const title = getLevelTitle(level);

  return (
    <Card className="relative overflow-hidden border-border bg-gradient-to-br from-primary/10 to-chart-3/5">
      <div className="absolute top-0 right-0 p-3 opacity-20">
        <Sparkles className="h-24 w-24 text-primary animate-spin" style={{ animationDuration: "12s" }} />
      </div>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-lg border border-primary/20">
          <Shield className="h-7 w-7 fill-primary/5 animate-pulse" />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Status Title</span>
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
          </div>
          <h3 className="text-lg font-bold tracking-tight text-foreground truncate">{title}</h3>
          <p className="text-xs text-muted-foreground truncate">
            Level Rank {level} — Keep studying to unlock higher tiers
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
