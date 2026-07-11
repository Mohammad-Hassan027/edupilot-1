import React, { useState } from "react";
import type { AchievementWithStatus } from "@/types/goals";
import { AchievementBadge } from "./achievement-badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Lock, Sparkles } from "lucide-react";

interface AchievementGridProps {
  achievements: AchievementWithStatus[];
}

export function AchievementGrid({ achievements }: AchievementGridProps) {
  const [filter, setFilter] = useState<"all" | "earned" | "locked">("all");

  const earned = achievements.filter((a) => a.earned);
  const locked = achievements.filter((a) => !a.earned);

  const displayedAchievements =
    filter === "earned" ? earned : filter === "locked" ? locked : achievements;

  return (
    <div className="space-y-4">
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-border/40">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Achievements Gallery
          </h3>
          <p className="text-xs text-muted-foreground">
            Complete study milestones to unlock badges and earn bonus XP.
          </p>
        </div>

        <Tabs value={filter} onValueChange={(val: any) => setFilter(val)} className="w-full sm:w-auto">
          <TabsList className="bg-secondary/40 border border-border/40 w-full sm:w-auto grid grid-cols-3">
            <TabsTrigger value="all" className="text-xs font-semibold">
              All ({achievements.length})
            </TabsTrigger>
            <TabsTrigger value="earned" className="text-xs font-semibold">
              Earned ({earned.length})
            </TabsTrigger>
            <TabsTrigger value="locked" className="text-xs font-semibold">
              Locked ({locked.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Grid */}
      {displayedAchievements.length === 0 ? (
        <Card className="border border-dashed border-border bg-card/20 py-10">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-2">
            {filter === "earned" ? (
              <>
                <Lock className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground font-semibold">No badges earned yet</p>
                <p className="text-xs text-muted-foreground/80">Complete goals and start studying to earn your first badge!</p>
              </>
            ) : (
              <>
                <Award className="h-8 w-8 text-yellow-500/30 mx-auto" />
                <p className="text-sm text-muted-foreground font-semibold">No locked achievements</p>
                <p className="text-xs text-muted-foreground/80">Amazing job! You have unlocked all achievement badges!</p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {displayedAchievements.map((achievement) => (
            <AchievementBadge key={achievement.id} achievement={achievement} />
          ))}
        </div>
      )}
    </div>
  );
}
