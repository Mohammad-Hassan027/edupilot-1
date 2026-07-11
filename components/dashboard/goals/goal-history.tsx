import React from "react";
import type { StudyGoal } from "@/types/goals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Trophy } from "lucide-react";

interface GoalHistoryProps {
  goals: StudyGoal[];
}

export function GoalHistory({ goals }: GoalHistoryProps) {
  const completedGoals = goals.filter((g) => g.status === "completed");

  const formatCompletedDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  };

  return (
    <Card className="border-border bg-card/60 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
          <Trophy className="h-5 w-5 text-primary" />
          Completion History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {completedGoals.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-semibold">No goals completed yet</p>
            <p className="text-xs text-muted-foreground/85">Complete study sessions to start build history</p>
          </div>
        ) : (
          <div className="relative border-l border-border ml-3.5 space-y-5">
            {completedGoals.map((goal) => {
              const dateFormatted = formatCompletedDate(goal.updated_at);
              return (
                <div key={goal.id} className="relative pl-6">
                  {/* Timeline point */}
                  <div className="absolute -left-2 top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-4 ring-background">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                  </div>
                  
                  <div className="space-y-0.5">
                    <h5 className="font-semibold text-foreground text-sm leading-snug">
                      {goal.title}
                    </h5>
                    <p className="text-xs text-muted-foreground">
                      Type: <span className="capitalize">{goal.goal_type}</span>
                      {dateFormatted && ` • Finished on ${dateFormatted}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
