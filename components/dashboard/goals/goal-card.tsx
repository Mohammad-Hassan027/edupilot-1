import React, { useState } from "react";
import type { StudyGoal } from "@/types/goals";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoalProgress } from "./goal-progress";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CheckCircle2,
  Edit2,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";

interface GoalCardProps {
  goal: StudyGoal;
  onUpdate: (id: string, updates: Partial<StudyGoal>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (goal: StudyGoal) => void;
}

export function GoalCard({ goal, onUpdate, onDelete, onEdit }: GoalCardProps) {
  const [updating, setUpdating] = useState(false);

  const isCompleted = goal.status === "completed";

  // Type styling configuration
  const typeConfigs = {
    daily: { label: "Daily", class: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/15" },
    weekly: { label: "Weekly", class: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/15" },
    monthly: { label: "Monthly", class: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/15" },
  };

  const currentConfig = typeConfigs[goal.goal_type] || typeConfigs.daily;

  const handleQuickProgress = async (increment: boolean) => {
    if (updating) return;
    setUpdating(true);
    try {
      const delta = increment ? 1 : -1;
      const nextValue = Math.max(0, goal.current_value + delta);
      await onUpdate(goal.id, { current_value: nextValue });
    } catch (err) {
      console.error("[GoalCard] Quick progress error:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkComplete = async () => {
    if (updating) return;
    setUpdating(true);
    try {
      await onUpdate(goal.id, { status: "completed", current_value: goal.target_value });
    } catch (err) {
      console.error("[GoalCard] Mark complete error:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this goal?")) {
      await onDelete(goal.id);
    }
  };

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return null;
    }
  };

  const dueDateFormatted = formatDueDate(goal.due_date);

  return (
    <Card className={`border-border bg-card/60 backdrop-blur-md relative overflow-hidden transition-all ${isCompleted ? "opacity-80 border-emerald-500/20" : ""}`}>
      {isCompleted && (
        <div className="absolute top-0 right-0 p-1.5 bg-emerald-500 text-white rounded-bl-lg shadow-sm">
          <CheckCircle2 className="h-4 w-4" />
        </div>
      )}
      <CardContent className="p-5 space-y-4">
        {/* Card Header Info */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className={`${currentConfig.class} text-xs font-semibold px-2 py-0.5 border-none rounded-full`}>
                {currentConfig.label}
              </Badge>
              {dueDateFormatted && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Due {dueDateFormatted}</span>
                </div>
              )}
            </div>
            <h4 className="font-bold text-foreground text-base tracking-tight leading-tight truncate">
              {goal.title}
            </h4>
            {goal.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {goal.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(goal)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <GoalProgress current={goal.current_value} target={goal.target_value} />

        {/* Quick Actions */}
        {!isCompleted && (
          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuickProgress(false)}
                disabled={updating || goal.current_value === 0}
                className="h-7 w-7 border-border hover:bg-secondary text-foreground"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleQuickProgress(true)}
                disabled={updating}
                className="h-7 w-7 border-border hover:bg-secondary text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={handleMarkComplete}
              disabled={updating}
              className="h-7 px-3 text-xs font-semibold hover:bg-primary/10 hover:text-primary transition-all rounded-lg"
            >
              Mark Complete
            </Button>
          </div>
        )}

        {isCompleted && (
          <div className="flex items-center justify-end text-xs text-emerald-500 font-bold gap-1 pt-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Completed</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
