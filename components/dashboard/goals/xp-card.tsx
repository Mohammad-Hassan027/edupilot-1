import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "./progress-ring";
import { Award, Zap } from "lucide-react";

interface XPCardProps {
  totalXp: number;
  level: number;
}

export function XPCard({ totalXp, level }: XPCardProps) {
  const xpInCurrentLevel = totalXp % 1000;
  const xpNeededForNextLevel = 1000 - xpInCurrentLevel;
  const progressPercent = (xpInCurrentLevel / 1000) * 100;

  return (
    <Card className="relative overflow-hidden border-border bg-card/60 backdrop-blur-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500 animate-pulse" />
          XP Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <p className="text-sm text-muted-foreground">
            Current Level: <span className="font-bold text-foreground">Level {level}</span>
          </p>
          <p className="text-3xl font-extrabold tracking-tight text-foreground">
            {totalXp.toLocaleString()} <span className="text-sm font-medium text-muted-foreground">XP Total</span>
          </p>
          <div className="flex items-center gap-1.5 justify-center sm:justify-start text-xs text-muted-foreground mt-1">
            <Award className="h-3.5 w-3.5 text-primary" />
            <span>{xpNeededForNextLevel} XP needed to reach Level {level + 1}</span>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <ProgressRing progress={progressPercent} size={110} strokeWidth={8} />
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">LVL</span>
            <span className="text-2xl font-black text-foreground">{level}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
