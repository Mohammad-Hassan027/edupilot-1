"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LoginGateModal } from "@/components/login-gate-modal";
import { useUser } from "@/hooks/use-user";
import { canAccessFeature } from "@/lib/plans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Sparkles,
  Check,
  Brain,
  Loader2,
  Crown,
  History,
  Eye,
  Trash2,
  Bell,
  BellOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  time: string;
  duration: string;
  subject: string;
  completed: boolean;
}

interface AIScheduleItem {
  time: string;
  activity: string;
  reason: string;
  selected?: boolean;
}

interface SavedStudyPlan {
  id: string;
  title: string;
  goal: string | null;
  selected_day: number;
  tasks: Array<{
    id: string;
    title: string;
    time: string;
    duration: string;
    subject: string;
    completed: boolean;
    day: number;
  }>;
  created_at: string;
  updated_at: string;
  reminders_enabled?: boolean;
}

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const currentDate = new Date();
const currentMonth = currentDate.toLocaleString("default", {
  month: "long",
  year: "numeric",
});

const generateCalendarDays = (eventDays: Set<number>) => {
  const days = [];
  const firstDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  ).getDay();
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  ).getDate();

  for (let i = 0; i < firstDay; i++) {
    days.push({ day: null, events: 0 });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const eventCount = Array.from(eventDays).filter((d) => d === i).length;
    days.push({ day: i, events: eventCount });
  }

  return days;
};

const initialTasks: Task[] = [];

const subjectColors: Record<string, string> = {
  Mathematics: "border-l-primary bg-primary/5",
  Physics: "border-l-violet-500 bg-violet-500/5",
  Chemistry: "border-l-emerald-500 bg-emerald-500/5",
  Break: "border-l-muted-foreground bg-muted/30",
  "AI Study": "border-l-orange-500 bg-orange-500/5",
};

const aiSuggestionsData: AIScheduleItem[] = [
  {
    time: "08:00 - 09:30",
    activity: "Mathematics (Peak focus time)",
    reason: "Your analytics show best performance in mornings",
    selected: false,
  },
  {
    time: "10:00 - 11:00",
    activity: "Break + Light Review",
    reason: "Scheduled break to maintain productivity",
    selected: false,
  },
  {
    time: "11:00 - 12:30",
    activity: "Physics Problems",
    reason: "Practice sessions work well mid-morning",
    selected: false,
  },
  {
    time: "14:00 - 15:30",
    activity: "Chemistry Concepts",
    reason: "New material learning optimal after lunch",
    selected: false,
  },
  {
    time: "16:00 - 17:00",
    activity: "AI Tutor Q&A",
    reason: "Clear up doubts before end of day",
    selected: false,
  },
];

function formatRelativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function PlannerPage() {
  const { subscription, isLoading, error: userError, email } = useUser();

  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [taskDays, setTaskDays] = useState<Record<string, number>>({});
  const [selectedDay, setSelectedDay] = useState(currentDate.getDate());
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] =
    useState<AIScheduleItem[]>(aiSuggestionsData);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("");
  const [newTaskDuration, setNewTaskDuration] = useState("1h");
  const [newTaskSubject, setNewTaskSubject] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGoal, setAiGoal] = useState("");
  const [aiGenerated, setAiGenerated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingPlannerAction, setPendingPlannerAction] = useState<
    null | "open_task" | "open_ai"
  >(null);

  const [history, setHistory] = useState<SavedStudyPlan[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [pageError, setPageError] = useState("");
  const [reminderTogglingId, setReminderTogglingId] = useState<string | null>(
    null,
  );

  const canUsePlanner = canAccessFeature(subscription, "planner");
  const activePlanName = canUsePlanner
    ? subscription?.plan_id === "premium"
      ? "Premium"
      : subscription?.plan_id === "pro"
        ? "Pro"
        : null
    : null;

  const calendarDays = generateCalendarDays(new Set(Object.values(taskDays)));
  const visibleTasks = useMemo(
    () => tasks.filter((task) => taskDays[task.id] === selectedDay),
    [tasks, taskDays, selectedDay],
  );

  const guardPlannerAccess = (action: "open_task" | "open_ai") => {
    if (isLoading) {
      setPendingPlannerAction(action);
      return false;
    }
    if (userError === "not_authenticated" || !email) {
      setShowLoginModal(true);
      return false;
    }
    if (!canUsePlanner) {
      setPendingPlannerAction(action);
      window.location.href = "/pricing?plan=premium&feature=planner";
      return false;
    }
    return true;
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const planId = new URLSearchParams(window.location.search).get("plan");
    if (!planId) return;

    const existing = history.find((item) => item.id === planId);
    if (existing) {
      openSavedPlan(existing);
      return;
    }

    if (!historyLoading) {
      void loadSavedPlan(planId);
    }
  }, [history, historyLoading]);

  useEffect(() => {
    if (!pendingPlannerAction || isLoading) return;

    const action = pendingPlannerAction;
    setPendingPlannerAction(null);

    if (userError === "not_authenticated" || !email) {
      setShowLoginModal(true);
      return;
    }

    if (!canUsePlanner) {
      window.location.href = "/pricing?plan=premium&feature=planner";
      return;
    }

    if (action === "open_task") {
      setIsAddingTask(true);
      return;
    }

    setShowAISuggestions(true);
  }, [pendingPlannerAction, isLoading, userError, email, canUsePlanner]);

  async function loadHistory() {
    try {
      setHistoryLoading(true);
      const response = await fetch("/api/ai/planner", { cache: "no-store" });
      const data = await response.json().catch(() => ({ plans: [] }));

      if (response.ok) {
        const plans = data.plans || [];
        setHistory(plans);

        if (plans.length > 0 && typeof window !== "undefined") {
          const urlPlanId = new URLSearchParams(window.location.search).get(
            "plan",
          );
          if (!urlPlanId) {
            openSavedPlan(plans[0]);
          }
        }
      }
    } catch {
      //
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadSavedPlan(planId: string) {
    try {
      const response = await fetch(`/api/ai/planner/${planId}`, {
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.plan) return;

      const plan = data.plan as SavedStudyPlan;
      setHistory((prev) =>
        prev.some((item) => item.id === plan.id) ? prev : [plan, ...prev],
      );
      openSavedPlan(plan);
    } catch {
      //
    }
  }

  function openSavedPlan(plan: SavedStudyPlan) {
    const restoredTasks: Task[] = (plan.tasks || []).map((task) => ({
      id: task.id,
      title: task.title,
      time: task.time,
      duration: task.duration,
      subject: task.subject,
      completed: task.completed,
    }));

    const restoredDays: Record<string, number> = {};
    for (const task of plan.tasks || []) {
      restoredDays[task.id] =
        Number(task.day) || plan.selected_day || currentDate.getDate();
    }

    setTasks(restoredTasks);
    setTaskDays(restoredDays);
    setSelectedDay(plan.selected_day || currentDate.getDate());
    setCurrentPlanId(plan.id);
    setAiGoal(plan.goal || "");

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("plan", plan.id);
      window.history.replaceState({}, "", url.toString());
    }
  }

  async function persistPlan(
    nextTasks: Task[],
    nextTaskDays: Record<string, number>,
    planTitle?: string,
    goal?: string | null,
  ) {
    if (!email || !canUsePlanner) return;

    try {
      setSavingPlan(true);
      setPageError("");

      const payload = {
        planId: currentPlanId,
        title:
          planTitle ||
          (goal?.trim()
            ? `${goal.trim()} Plan`
            : nextTasks[0]?.title
              ? `${nextTasks[0].title} Plan`
              : "Study Plan"),
        goal: goal ?? aiGoal ?? "",
        selectedDay,
        tasks: nextTasks.map((task) => ({
          ...task,
          day: nextTaskDays[task.id] ?? selectedDay,
        })),
      };

      const response = await fetch("/api/ai/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to save planner");
      }

      const savedPlan = data.plan as SavedStudyPlan;
      setCurrentPlanId(savedPlan.id);
      setHistory((prev) =>
        [savedPlan, ...prev.filter((item) => item.id !== savedPlan.id)].slice(
          0,
          12,
        ),
      );

      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("plan", savedPlan.id);
        window.history.replaceState({}, "", url.toString());
      }
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "Failed to save planner",
      );
    } finally {
      setSavingPlan(false);
    }
  }

  const toggleTask = async (id: string) => {
    const nextTasks = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t,
    );
    setTasks(nextTasks);
    await persistPlan(nextTasks, taskDays);
  };

  const handleAddTask = async () => {
    if (!guardPlannerAccess("open_task")) return;
    if (!newTaskTitle.trim() || !newTaskTime || !newTaskSubject.trim()) {
      return;
    }

    const taskId = Date.now().toString();

    const newTask: Task = {
      id: taskId,
      title: newTaskTitle.trim(),
      time: newTaskTime,
      duration: newTaskDuration,
      subject: newTaskSubject.trim(),
      completed: false,
    };

    const nextTasks = [...tasks, newTask];
    const nextTaskDays = { ...taskDays, [taskId]: selectedDay };

    setTasks(nextTasks);
    setTaskDays(nextTaskDays);

    await persistPlan(
      nextTasks,
      nextTaskDays,
      `${newTaskTitle.trim()} Plan`,
      aiGoal || null,
    );

    setNewTaskTitle("");
    setNewTaskTime("");
    setNewTaskDuration("1h");
    setNewTaskSubject("");
    setIsAddingTask(false);
  };

  const toggleAISuggestion = (index: number) => {
    setAiSuggestions(
      aiSuggestions.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item,
      ),
    );
  };

  const handleApplySchedule = async () => {
    const selectedItems = aiSuggestions.filter((item) => item.selected);
    if (!selectedItems.length) return;

    const newTasks = selectedItems.map((item, index) => {
      const taskId = `${Date.now()}-${index}-${Math.random()}`;
      return {
        id: taskId,
        title: item.activity,
        time: item.time.split(" - ")[0],
        duration: "1h",
        subject: item.activity.split("(")[0].trim(),
        completed: false,
      };
    });

    const nextTasks = [...tasks, ...newTasks];
    const nextTaskDays = { ...taskDays };
    newTasks.forEach((task) => {
      nextTaskDays[task.id] = selectedDay;
    });

    setTasks(nextTasks);
    setTaskDays(nextTaskDays);

    await persistPlan(
      nextTasks,
      nextTaskDays,
      aiGoal.trim() ? `${aiGoal.trim()} Plan` : "AI Study Plan",
      aiGoal.trim() || null,
    );

    setAiSuggestions(aiSuggestionsData);
    setShowAISuggestions(false);
    setAiGenerated(false);
  };

  const handleGenerateAIPlan = async () => {
    if (!aiGoal.trim()) return;
    if (!guardPlannerAccess("open_ai")) return;

    setAiLoading(true);
    try {
      const prompt = `You are a study planner AI. Create a daily study schedule for a student.
Goal: ${aiGoal}
Available study hours today: ${4} hours
Current time: ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}

Return ONLY a valid JSON array. No markdown, no backticks:
[{"time":"09:00 - 10:30","activity":"Subject Name (specific task)","reason":"Why this timing is optimal"}]

Generate 5-6 schedule items that fit within 4 hours total. Make times realistic and specific to the goal.`;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });

      const data = await res.json();
      if (!res.ok) return;

      const cleaned = String(data.reply || "")
        .replace(/\`\`\`json\s*/g, "")
        .replace(/\`\`\`\s*/g, "")
        .trim();

      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed)) {
        setAiSuggestions(
          parsed.map((item: AIScheduleItem) => ({ ...item, selected: false })),
        );
        setAiGenerated(true);

        fetch("/api/usage/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feature: "study_plan",
            action: "plan_generated",
            metadata: { goal: aiGoal, sessionCount: parsed.length },
          }),
        }).catch(() => undefined);
      }
    } catch {
      setAiSuggestions(
        aiSuggestionsData.map((s) => ({ ...s, selected: false })),
      );
      setAiGenerated(true);
    } finally {
      setAiLoading(false);
    }
  };

  async function handleDeleteHistory(planId: string) {
    try {
      const response = await fetch(`/api/ai/planner/${planId}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete planner history");
      }

      const remaining = history.filter((item) => item.id !== planId);
      setHistory(remaining);

      if (currentPlanId === planId) {
        setCurrentPlanId(null);
        setTasks([]);
        setTaskDays({});
        setAiGoal("");
        if (remaining[0]) {
          openSavedPlan(remaining[0]);
        } else if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("plan");
          window.history.replaceState({}, "", url.toString());
        }
      }
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "Failed to delete planner history",
      );
    }
  }

  async function handleToggleReminders(plan: SavedStudyPlan) {
    const nextValue = !plan.reminders_enabled;
    setReminderTogglingId(plan.id);

    // optimistic update
    setHistory((prev) =>
      prev.map((item) =>
        item.id === plan.id ? { ...item, reminders_enabled: nextValue } : item,
      ),
    );

    try {
      const response = await fetch(`/api/ai/planner/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remindersEnabled: nextValue }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to update reminder setting");
      }
    } catch (err) {
      // revert on failure
      setHistory((prev) =>
        prev.map((item) =>
          item.id === plan.id
            ? { ...item, reminders_enabled: plan.reminders_enabled }
            : item,
        ),
      );
      setPageError(
        err instanceof Error ? err.message : "Failed to update reminder setting",
      );
    } finally {
      setReminderTogglingId(null);
    }
  }

  return (
    <>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Study Planner
            </h1>
            <p className="text-muted-foreground">
              Plan and organize your study schedule
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                if (!guardPlannerAccess("open_ai")) return;
                setShowAISuggestions(true);
              }}
            >
              <Sparkles className="h-4 w-4" />
              AI Planner
            </Button>

            <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
              <DialogTrigger asChild>
                <Button
                  className="gap-2"
                  onClick={(e) => {
                    if (!guardPlannerAccess("open_task")) {
                      e.preventDefault();
                      return;
                    }
                    setIsAddingTask(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add Task
                </Button>
              </DialogTrigger>

              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Add Study Task</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Task Title</Label>
                    <Input
                      placeholder="e.g., Review Chapter 5"
                      className="bg-secondary border-border"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        className="bg-secondary border-border"
                        value={newTaskTime}
                        onChange={(e) => setNewTaskTime(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Select
                        value={newTaskDuration}
                        onValueChange={setNewTaskDuration}
                      >
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30m">30 minutes</SelectItem>
                          <SelectItem value="1h">1 hour</SelectItem>
                          <SelectItem value="1.5h">1.5 hours</SelectItem>
                          <SelectItem value="2h">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input
                      placeholder="e.g., Mathematics, Physics, Chemistry"
                      className="bg-secondary border-border"
                      value={newTaskSubject}
                      onChange={(e) => setNewTaskSubject(e.target.value)}
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleAddTask}
                    disabled={savingPlan}
                  >
                    {savingPlan ? "Saving..." : "Add Task"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {pageError ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {pageError}
          </div>
        ) : null}

        {activePlanName ? (
          <Card className="border-emerald-500/30 bg-emerald-500/10">
            <CardContent className="flex items-start gap-3 p-4 text-sm">
              <Crown className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              <div>
                <p className="font-medium text-foreground">
                  You are on {activePlanName} Plan.
                </p>
                <p className="mt-1 text-muted-foreground">
                  Your premium features are now active across the app.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : !canUsePlanner ? (
          <Card className="border-amber-500/30 bg-amber-500/10">
            <CardContent className="flex items-start gap-3 p-4 text-sm">
              <Crown className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="font-medium text-foreground">
                  Planner is a Premium feature.
                </p>
                <p className="mt-1 text-muted-foreground">
                  Upgrade on the Pricing page to unlock Planner instantly after
                  successful payment.
                </p>
                <div className="mt-3">
                  <Button asChild size="sm" variant="outline">
                    <Link href="/pricing?plan=premium&feature=planner">
                      View Pricing
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* <div className="grid gap-6 lg:grid-cols-4">
          <Card className="lg:col-span-1 border-border bg-card h-[620px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">{currentMonth}</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="py-1">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((item, index) => (
                  <button
                    key={index}
                    disabled={!item.day}
                    onClick={() => item.day && setSelectedDay(item.day)}
                    className={cn(
                      "aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all relative",
                      !item.day && "invisible",
                      item.day === selectedDay && "bg-primary text-primary-foreground",
                      item.day === currentDate.getDate() && item.day !== selectedDay && "border border-primary",
                      item.day && item.day !== selectedDay && "hover:bg-secondary"
                    )}
                  >
                    {item.day}
                    {item.events > 0 && item.day !== selectedDay && (
                      <div className="absolute bottom-1 flex gap-0.5">
                        {Array.from({ length: Math.min(item.events, 3) }).map((_, i) => (
                          <div key={i} className="h-1 w-1 rounded-full bg-primary" />
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-border bg-card h-[620px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{currentMonth.split(' ')[0]} {selectedDay}, {currentMonth.split(' ')[1]}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {visibleTasks.length} tasks scheduled
                    {savingPlan ? " • saving..." : ""}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto space-y-3 pr-2">
              {visibleTasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-6 text-center text-sm text-muted-foreground">
                  No tasks added for this day yet. Click <span className="font-medium text-foreground">Add Task</span> to create your first planner item.
                </div>
              ) : (
                visibleTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center gap-4 rounded-lg border-l-4 p-4 transition-all",
                      subjectColors[task.subject] || "border-l-border bg-secondary/30",
                      task.completed && "opacity-60"
                    )}
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                        task.completed
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-muted-foreground hover:border-primary"
                      )}
                    >
                      {task.completed && <Check className="h-4 w-4 text-white" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={cn("font-medium text-foreground", task.completed && "line-through")}>
                        {task.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{task.subject}</p>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {task.time} • {task.duration}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-1 border-border bg-card h-[620px] flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4 text-primary" />
                Planner History
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto space-y-3 pr-2">
              {historyLoading ? (
                <div className="text-sm text-muted-foreground">Loading history...</div>
              ) : history.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
                  No planner history yet.
                </div>
              ) : (
                history.map((plan) => (
                  <div
                    key={plan.id}
                    className={cn(
                      "rounded-lg border p-3",
                      currentPlanId === plan.id ? "border-primary bg-primary/5" : "border-border bg-secondary/20"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{plan.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {(plan.tasks || []).length} tasks • {formatRelativeTime(plan.updated_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openSavedPlan(plan)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-300"
                          onClick={() => handleDeleteHistory(plan.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {plan.goal ? (
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{plan.goal}</p>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div> */}
        <div className="grid gap-6 lg:grid-cols-4">
          <Card className="lg:col-span-1 border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">{currentMonth}</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="py-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((item, index) => (
                  <button
                    key={index}
                    disabled={!item.day}
                    onClick={() => item.day && setSelectedDay(item.day)}
                    className={cn(
                      "aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all relative",
                      !item.day && "invisible",
                      item.day === selectedDay &&
                        "bg-primary text-primary-foreground",
                      item.day === currentDate.getDate() &&
                        item.day !== selectedDay &&
                        "border border-primary",
                      item.day &&
                        item.day !== selectedDay &&
                        "hover:bg-secondary",
                    )}
                  >
                    {item.day}
                    {item.events > 0 && item.day !== selectedDay && (
                      <div className="absolute bottom-1 flex gap-0.5">
                        {Array.from({ length: Math.min(item.events, 3) }).map(
                          (_, i) => (
                            <div
                              key={i}
                              className="h-1 w-1 rounded-full bg-primary"
                            />
                          ),
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-border bg-card h-[620px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    {currentMonth.split(" ")[0]} {selectedDay},{" "}
                    {currentMonth.split(" ")[1]}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {visibleTasks.length} tasks scheduled
                    {savingPlan ? " • saving..." : ""}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto space-y-3 pr-2">
              {visibleTasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-6 text-center text-sm text-muted-foreground">
                  No tasks added for this day yet. Click{" "}
                  <span className="font-medium text-foreground">Add Task</span>{" "}
                  to create your first planner item.
                </div>
              ) : (
                visibleTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center gap-4 rounded-lg border-l-4 p-4 transition-all",
                      subjectColors[task.subject] ||
                        "border-l-border bg-secondary/30",
                      task.completed && "opacity-60",
                    )}
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                        task.completed
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-muted-foreground hover:border-primary",
                      )}
                    >
                      {task.completed && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "font-medium text-foreground",
                          task.completed && "line-through",
                        )}
                      >
                        {task.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {task.subject}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {task.time} • {task.duration}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-1 border-border bg-card h-[620px] flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4 text-primary" />
                Planner History
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto space-y-3 pr-2">
              {historyLoading ? (
                <div className="text-sm text-muted-foreground">
                  Loading history...
                </div>
              ) : history.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
                  No planner history yet.
                </div>
              ) : (
                history.map((plan) => (
                  <div
                    key={plan.id}
                    className={cn(
                      "rounded-lg border p-3",
                      currentPlanId === plan.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-secondary/20",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {plan.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(plan.tasks || []).length} tasks •{" "}
                          {formatRelativeTime(plan.updated_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8",
                            plan.reminders_enabled
                              ? "text-primary hover:text-primary"
                              : "text-muted-foreground",
                          )}
                          title={
                            plan.reminders_enabled
                              ? "Email reminders on for this plan"
                              : "Email reminders off for this plan"
                          }
                          disabled={reminderTogglingId === plan.id}
                          onClick={() => handleToggleReminders(plan)}
                        >
                          {plan.reminders_enabled ? (
                            <Bell className="h-4 w-4" />
                          ) : (
                            <BellOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openSavedPlan(plan)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-300"
                          onClick={() => handleDeleteHistory(plan.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {plan.goal ? (
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                        {plan.goal}
                      </p>
                    ) : null}
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {plan.reminders_enabled
                        ? "Email reminders on"
                        : "Email reminders off"}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog
          open={showAISuggestions}
          onOpenChange={(open) => {
            setShowAISuggestions(open);
            if (!open) {
              setAiGenerated(false);
            }
          }}
        >
          <DialogContent className="bg-card border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Study Plan Generator
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              {!aiGenerated ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Tell the AI what you want to study today and it will create
                    a personalized schedule.
                  </p>

                  <div className="space-y-2">
                    <Label>What do you want to study today?</Label>
                    <Input
                      placeholder="e.g. Calculus, Machine Learning, History..."
                      value={aiGoal}
                      onChange={(e) => setAiGoal(e.target.value)}
                      className="bg-secondary border-border"
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleGenerateAIPlan()
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Available hours today</Label>
                    <Select defaultValue="4">
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["2", "3", "4", "5", "6", "8"].map((h) => (
                          <SelectItem key={h} value={h}>
                            {h} hours
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowAISuggestions(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 gap-2"
                      onClick={handleGenerateAIPlan}
                      disabled={!aiGoal.trim() || aiLoading}
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Generate Plan
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Here&apos;s your AI-generated study schedule. Select
                    sessions to add to your planner:
                  </p>

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {aiSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => toggleAISuggestion(index)}
                        className={cn(
                          "flex items-start gap-4 p-3 rounded-lg transition-all border-2 text-left w-full",
                          suggestion.selected
                            ? "bg-primary/10 border-primary"
                            : "bg-secondary/50 border-border hover:border-primary/50",
                        )}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <div
                            className={cn(
                              "h-5 w-5 rounded border-2 flex items-center justify-center transition-all",
                              suggestion.selected
                                ? "bg-primary border-primary"
                                : "border-muted-foreground",
                            )}
                          >
                            {suggestion.selected && (
                              <Check className="h-3 w-3 text-primary-foreground" />
                            )}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="text-sm font-medium text-primary mb-1">
                            {suggestion.time}
                          </div>
                          <p className="font-medium text-foreground">
                            {suggestion.activity}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {suggestion.reason}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setAiGenerated(false);
                      }}
                    >
                      ← Back
                    </Button>

                    <Button
                      className="flex-1 gap-2"
                      onClick={handleApplySchedule}
                      disabled={
                        !aiSuggestions.some((item) => item.selected) ||
                        savingPlan
                      }
                    >
                      <Check className="h-4 w-4" />
                      {savingPlan
                        ? "Saving..."
                        : `Apply Selected (${aiSuggestions.filter((item) => item.selected).length})`}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <LoginGateModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        featureName="Study Planner"
      />
    </>
  );
}
