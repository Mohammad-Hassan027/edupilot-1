"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckSquare, Plus, MoreHorizontal, Clock, AlertCircle, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  category: string
  dueTime: string
  priority: "high" | "medium" | "low"
  completed: boolean
  starred: boolean
}

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Review yesterday's notes",
    category: "Review",
    dueTime: "Today, 6:00 PM",
    priority: "high",
    completed: false,
    starred: true,
  },
  {
    id: "2",
    title: "Practice flashcards",
    category: "Practice",
    dueTime: "Today, 8:00 PM",
    priority: "medium",
    completed: false,
    starred: false,
  },
  {
    id: "3",
    title: "Take quiz on weak topics",
    category: "Assessment",
    dueTime: "Tomorrow, 10:00 AM",
    priority: "low",
    completed: true,
    starred: false,
  },
  {
    id: "4",
    title: "Listen to AI summary",
    category: "Learning",
    dueTime: "Tomorrow, 2:00 PM",
    priority: "medium",
    completed: false,
    starred: true,
  },
]

const priorityStyles = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-primary/10 text-primary border-primary/20",
  low: "bg-muted text-muted-foreground border-border",
}

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task))
    )
  }

  const toggleStar = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, starred: !task.starred } : task))
    )
  }

  const completedCount = tasks.filter((t) => t.completed).length
  const progress = (completedCount / tasks.length) * 100

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
            <CheckSquare className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">Today's Learning Tasks</CardTitle>
            <p className="text-xs text-muted-foreground">
              {completedCount} of {tasks.length} completed
            </p>
          </div>
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "group flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3 transition-all hover:bg-secondary/50",
                task.completed && "opacity-60"
              )}
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => toggleTask(task.id)}
                className="mt-0.5 border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium text-foreground",
                    task.completed && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">{task.category}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {task.dueTime}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleStar(task.id)}
                  className={cn(
                    "rounded p-1 transition-colors",
                    task.starred
                      ? "text-primary"
                      : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary"
                  )}
                >
                  <Star className={cn("h-4 w-4", task.starred && "fill-current")} />
                </button>
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                    priorityStyles[task.priority]
                  )}
                >
                  {task.priority === "high" && <AlertCircle className="h-3 w-3" />}
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Add Task Button */}
        <Button
          variant="outline"
          className="w-full border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Task
        </Button>
      </CardContent>
    </Card>
  )
}
