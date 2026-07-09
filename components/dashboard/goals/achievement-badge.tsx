import React from "react";
import type { AchievementWithStatus } from "@/types/goals";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import * as Icons from "lucide-react";

interface AchievementBadgeProps {
  achievement: AchievementWithStatus;
}

export function AchievementBadge({ achievement }: AchievementBadgeProps) {
  // Dynamically resolve icon from lucide-react
  const IconComponent = (Icons as any)[achievement.icon] || Icons.Award;
  const isUnlocked = achievement.earned;

  // Grade color configs
  const categoryGradients: Record<string, string> = {
    first_ai_chat: "from-blue-500 to-indigo-500 shadow-blue-500/20",
    ten_flashcard_sets: "from-emerald-500 to-teal-500 shadow-emerald-500/20",
    five_study_plans: "from-cyan-500 to-blue-500 shadow-cyan-500/20",
    seven_day_streak: "from-orange-500 to-red-500 shadow-orange-500/20",
    one_hundred_ai_questions: "from-yellow-500 to-amber-600 shadow-yellow-500/20",
    goal_setter: "from-sky-500 to-indigo-500 shadow-sky-500/20",
    first_goal_completed: "from-emerald-400 to-emerald-600 shadow-emerald-500/20",
    twenty_five_goals_completed: "from-purple-500 to-pink-500 shadow-purple-500/20",
  };

  const gradient = categoryGradients[achievement.id] || "from-primary to-chart-3 shadow-primary/20";

  const earnedDateFormatted = achievement.earned_at
    ? new Date(achievement.earned_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className={`border-border bg-card/40 backdrop-blur-md relative overflow-hidden transition-all duration-300 group hover:-translate-y-1 ${
              isUnlocked
                ? "border-primary/25 cursor-pointer shadow-md"
                : "opacity-60 border-none shadow-none grayscale"
            }`}
          >
            {isUnlocked && (
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
            <CardContent className="p-4 flex flex-col items-center text-center space-y-2.5">
              {/* Badge Icon circle */}
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br shadow-lg ${
                  isUnlocked
                    ? `${gradient} text-white animate-pulse`
                    : "bg-secondary text-muted-foreground"
                }`}
                style={{ animationDuration: "3s" }}
              >
                {isUnlocked ? (
                  <IconComponent className="h-6 w-6 stroke-[2.5]" />
                ) : (
                  <Icons.Lock className="h-5 w-5 opacity-70" />
                )}
              </div>

              {/* Title & Desc */}
              <div className="space-y-1.5 w-full">
                <h5 className="font-bold text-foreground text-sm tracking-tight leading-snug truncate">
                  {achievement.title}
                </h5>
                <p className="text-xs text-muted-foreground/80 leading-normal line-clamp-2">
                  {achievement.description}
                </p>
              </div>

              {/* Progress or Earned Date */}
              <div className="w-full pt-1.5 border-t border-border/40">
                {isUnlocked ? (
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                    Unlocked {earnedDateFormatted}
                  </span>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
                      <span>Progress</span>
                      <span>
                        {achievement.current_value}/{achievement.required_value}
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-muted-foreground/50 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(achievement.current_value / achievement.required_value) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent className="bg-popover border border-border text-popover-foreground max-w-xs p-3 space-y-1.5 shadow-xl">
          <p className="font-bold text-sm text-foreground">{achievement.title}</p>
          <p className="text-xs text-muted-foreground">{achievement.description}</p>
          <p className="text-xs font-semibold text-yellow-500 flex items-center gap-1 mt-1">
            <Icons.Zap className="h-3 w-3 fill-yellow-500" />
            <span>Reward: +{achievement.xp_reward} XP</span>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
