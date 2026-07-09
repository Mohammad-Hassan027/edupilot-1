import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Trophy, Clock, Flame } from "lucide-react";

interface StatisticsCardProps {
  activeGoals: number;
  completedGoals: number;
  unlockedAchievements: number;
  totalAchievements: number;
}

export function StatisticsCard({
  activeGoals,
  completedGoals,
  unlockedAchievements,
  totalAchievements,
}: StatisticsCardProps) {
  const stats = [
    {
      label: "Active Goals",
      value: activeGoals,
      icon: Clock,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      description: "Goals currently in progress",
    },
    {
      label: "Goals Completed",
      value: completedGoals,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      description: "Successfully finished goals",
    },
    {
      label: "Badges Unlocked",
      value: `${unlockedAchievements}/${totalAchievements}`,
      icon: Trophy,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      description: "Achievements earned",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <Card key={i} className="border-border bg-card/60 backdrop-blur-md">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor}`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-foreground tracking-tight">{stat.value}</p>
                <p className="text-sm font-semibold text-muted-foreground truncate">{stat.label}</p>
                <p className="text-xs text-muted-foreground/80 truncate mt-0.5">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
