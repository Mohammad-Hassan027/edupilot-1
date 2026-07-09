"use client";

import React, { useEffect, useState } from "react";
import type { StudyGoal, AchievementWithStatus, UserXp } from "@/types/goals";
import { XPCard } from "@/components/dashboard/goals/xp-card";
import { LevelCard } from "@/components/dashboard/goals/level-card";
import { StatisticsCard } from "@/components/dashboard/goals/statistics-card";
import { GoalCard } from "@/components/dashboard/goals/goal-card";
import { GoalForm } from "@/components/dashboard/goals/goal-form";
import { GoalHistory } from "@/components/dashboard/goals/goal-history";
import { AchievementGrid } from "@/components/dashboard/goals/achievement-grid";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Award,
  Plus,
  RefreshCw,
  Trophy,
  Target,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";

export default function GoalsPage() {
  const { refetch: refetchUser } = useUser();

  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([]);
  const [xp, setXp] = useState<UserXp | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form controls
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<StudyGoal | null>(null);

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const [goalsRes, achievementsRes, xpRes] = await Promise.all([
        fetch("/api/goals", { cache: "no-store" }),
        fetch("/api/achievements", { cache: "no-store" }),
        fetch("/api/xp", { cache: "no-store" }),
      ]);

      const [goalsJson, achievementsJson, xpJson] = await Promise.all([
        goalsRes.json(),
        achievementsRes.json(),
        xpRes.json(),
      ]);

      if (!goalsRes.ok || !goalsJson.success) {
        throw new Error(goalsJson.error || "Failed to load goals");
      }
      if (!achievementsRes.ok || !achievementsJson.success) {
        throw new Error(achievementsJson.error || "Failed to load achievements");
      }
      if (!xpRes.ok || !xpJson.success) {
        throw new Error(xpJson.error || "Failed to load XP");
      }

      setGoals(goalsJson.data || []);
      setAchievements(achievementsJson.data || []);
      setXp(xpJson.data || null);
    } catch (err) {
      console.error("[GoalsPage] Error loading data:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerSweep = async () => {
    try {
      const res = await fetch("/api/achievements/check", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.achievementsUnlocked && data.achievementsUnlocked.length > 0) {
          data.achievementsUnlocked.forEach((badge: any) => {
            toast.success(`Achievement Unlocked: ${badge.title}!`, {
              description: badge.description,
              icon: <Trophy className="h-5 w-5 text-yellow-500 fill-yellow-500" />,
              duration: 8000,
            });
          });
          // Refresh data if achievements were unlocked during background sweep
          await loadData(true);
          void refetchUser(true, true);
        }
      }
    } catch (err) {
      console.error("[GoalsPage] Background achievements check error:", err);
    }
  };

  useEffect(() => {
    void loadData().then(() => {
      void triggerSweep();
    });
  }, []);

  const handleCreateOrUpdateGoal = async (data: {
    title: string;
    description: string | null;
    goal_type: "daily" | "weekly" | "monthly";
    target_value: number;
    due_date: string | null;
  }) => {
    try {
      let res;
      if (goalToEdit) {
        res = await fetch(`/api/goals/${goalToEdit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } else {
        res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save goal");
      }

      toast.success(goalToEdit ? "Goal updated successfully" : "Goal created successfully");

      // Check if this action triggered any achievements
      if (json.achievementsUnlocked && json.achievementsUnlocked.length > 0) {
        json.achievementsUnlocked.forEach((badge: any) => {
          toast.success(`Achievement Unlocked: ${badge.title}!`, {
            description: badge.description,
            icon: <Trophy className="h-5 w-5 text-yellow-500 fill-yellow-500" />,
            duration: 8000,
          });
        });
      }

      setGoalToEdit(null);
      await loadData(true);
      void refetchUser(true, true);
    } catch (err) {
      console.error("[GoalsPage] Save goal error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save goal");
      throw err;
    }
  };

  const handleUpdateGoalProgress = async (id: string, updates: Partial<StudyGoal>) => {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update goal progress");
      }

      // Special alert if goal completed
      if (json.data && json.data.status === "completed" && goals.find(g => g.id === id)?.status === "pending") {
        toast.success(`Goal Completed! +100 XP`, {
          icon: <Award className="h-5 w-5 text-yellow-500 fill-yellow-500" />,
        });
      }

      // Alerts for unlocked achievements
      if (json.achievementsUnlocked && json.achievementsUnlocked.length > 0) {
        json.achievementsUnlocked.forEach((badge: any) => {
          toast.success(`Achievement Unlocked: ${badge.title}!`, {
            description: badge.description,
            icon: <Trophy className="h-5 w-5 text-yellow-500 fill-yellow-500" />,
            duration: 8000,
          });
        });
      }

      await loadData(true);
      void refetchUser(true, true);
    } catch (err) {
      console.error("[GoalsPage] Progress update error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update goal");
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete goal");
      }

      toast.success("Goal deleted successfully");
      await loadData(true);
      void refetchUser(true, true);
    } catch (err) {
      console.error("[GoalsPage] Delete goal error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete goal");
    }
  };

  const handleStartEdit = (goal: StudyGoal) => {
    setGoalToEdit(goal);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setGoalToEdit(null);
    setIsFormOpen(false);
  };

  // Derived variables
  const activeGoals = goals.filter((g) => g.status === "pending");
  const completedGoals = goals.filter((g) => g.status === "completed");

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
        <div className="space-y-2">
          <Skeleton className="h-9 w-1/3 rounded-lg" />
          <Skeleton className="h-5 w-1/2 rounded-lg" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="grid gap-4 grid-cols-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto text-center space-y-4 pt-16">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mx-auto">
          <Target className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Failed to load Tracker</h3>
        <p className="text-sm text-muted-foreground leading-normal">{error}</p>
        <Button onClick={() => loadData()} className="gap-2 mx-auto">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-2 tracking-tight">
            <Trophy className="h-7 w-7 text-primary" />
            AI Goal Tracker & Achievements
          </h1>
          <p className="text-muted-foreground mt-1">
            Build habits, complete study goals, and unlock exclusive rewards.
          </p>
        </div>

        <Button onClick={() => setIsFormOpen(true)} className="gap-1.5 font-bold shadow-md rounded-xl shrink-0">
          <Plus className="h-4 w-4" />
          Add Study Goal
        </Button>
      </div>

      {/* Progress Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <XPCard totalXp={xp?.total_xp ?? 0} level={xp?.level ?? 1} />
        <LevelCard level={xp?.level ?? 1} />
      </div>

      {/* Statistics Section */}
      <StatisticsCard
        activeGoals={activeGoals.length}
        completedGoals={completedGoals.length}
        unlockedAchievements={achievements.filter((a) => a.earned).length}
        totalAchievements={achievements.length}
      />

      {/* Main Workspace Layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left Hand: Goals Tracker & Achievements */}
        <div className="space-y-8 min-w-0">
          {/* Goals section */}
          <div className="space-y-4">
            <div className="border-b border-border/40 pb-2 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Goals Tracker
              </h3>
            </div>

            <Tabs defaultValue="active" className="w-full">
              <TabsList className="bg-secondary/40 border border-border/40 w-full sm:w-[280px] grid grid-cols-2">
                <TabsTrigger value="active" className="text-xs font-semibold">
                  Active ({activeGoals.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-xs font-semibold">
                  Completed ({completedGoals.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-4">
                {activeGoals.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center bg-card/25">
                    <Target className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground">No active goals</p>
                    <p className="text-xs text-muted-foreground/80 mt-1 leading-normal max-w-xs mx-auto">
                      Stay focused by setting your daily, weekly, or monthly study targets.
                    </p>
                    <Button onClick={() => setIsFormOpen(true)} size="sm" variant="outline" className="mt-4 gap-1 rounded-lg">
                      <Plus className="h-3.5 w-3.5" />
                      Create a goal
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    {activeGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        onUpdate={handleUpdateGoalProgress}
                        onDelete={handleDeleteGoal}
                        onEdit={handleStartEdit}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-4">
                {completedGoals.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center bg-card/25">
                    <Award className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground">No completed goals yet</p>
                    <p className="text-xs text-muted-foreground/80 mt-1 leading-normal max-w-xs mx-auto">
                      Mark your active goals as complete to move them here and earn +100 XP.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    {completedGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        onUpdate={handleUpdateGoalProgress}
                        onDelete={handleDeleteGoal}
                        onEdit={handleStartEdit}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Achievement gallery */}
          <AchievementGrid achievements={achievements} />
        </div>

        {/* Right Hand Sidebar: Timeline & Completed History */}
        <div className="space-y-6">
          <GoalHistory goals={goals} />
        </div>
      </div>

      {/* Goal creation Form dialog */}
      <GoalForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleCreateOrUpdateGoal}
        goalToEdit={goalToEdit}
      />
    </div>
  );
}
