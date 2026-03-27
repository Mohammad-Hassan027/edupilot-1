"use client"

import { useEffect, useState } from "react"
import { LoginGateModal } from "@/components/login-gate-modal"
import { ChoosePlanModal } from "@/components/billing/choose-plan-modal"
import { useUser } from "@/hooks/use-user"
import { canAccessFeature } from "@/lib/plans"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock,
  Sparkles,
  Check,
  X,
  Brain,
  Loader2,
  Crown
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  time: string
  duration: string
  subject: string
  completed: boolean
}

interface AIScheduleItem {
  time: string
  activity: string
  reason: string
  selected?: boolean
}

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const currentDate = new Date()
const currentMonth = currentDate.toLocaleString("default", { month: "long", year: "numeric" })

const generateCalendarDays = () => {
  const days = []
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  
  for (let i = 0; i < firstDay; i++) {
    days.push({ day: null, events: 0 })
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, events: Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0 })
  }
  
  return days
}

const initialTasks: Task[] = [
  { id: "1", title: "Mathematics Study", time: "09:00", duration: "2h", subject: "Mathematics", completed: false },
  { id: "2", title: "Physics Review", time: "11:30", duration: "1.5h", subject: "Physics", completed: false },
  { id: "3", title: "Lunch Break", time: "13:00", duration: "1h", subject: "Break", completed: true },
  { id: "4", title: "Chemistry Lab", time: "14:30", duration: "2h", subject: "Chemistry", completed: false },
  { id: "5", title: "AI Tutor Session", time: "17:00", duration: "1h", subject: "AI Study", completed: false },
]

const subjectColors: Record<string, string> = {
  Mathematics: "border-l-primary bg-primary/5",
  Physics: "border-l-violet-500 bg-violet-500/5",
  Chemistry: "border-l-emerald-500 bg-emerald-500/5",
  Break: "border-l-muted-foreground bg-muted/30",
  "AI Study": "border-l-orange-500 bg-orange-500/5",
}

const aiSuggestionsData: AIScheduleItem[] = [
  { time: "08:00 - 09:30", activity: "Mathematics (Peak focus time)", reason: "Your analytics show best performance in mornings", selected: false },
  { time: "10:00 - 11:00", activity: "Break + Light Review", reason: "Scheduled break to maintain productivity", selected: false },
  { time: "11:00 - 12:30", activity: "Physics Problems", reason: "Practice sessions work well mid-morning", selected: false },
  { time: "14:00 - 15:30", activity: "Chemistry Concepts", reason: "New material learning optimal after lunch", selected: false },
  { time: "16:00 - 17:00", activity: "AI Tutor Q&A", reason: "Clear up doubts before end of day", selected: false },
]

export default function PlannerPage() {
  const { subscription, refetch, isLoading, error: userError, email } = useUser()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [selectedDay, setSelectedDay] = useState(currentDate.getDate())
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<AIScheduleItem[]>(aiSuggestionsData)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskTime, setNewTaskTime] = useState("")
  const [newTaskDuration, setNewTaskDuration] = useState("1h")
  const [newTaskSubject, setNewTaskSubject] = useState("")
  const calendarDays = generateCalendarDays()
  const [aiLoading, setAiLoading] = useState(false)
  const [aiGoal, setAiGoal] = useState("")
  const [aiHours, setAiHours] = useState("4")
  const [aiGenerated, setAiGenerated] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [pendingPlannerAction, setPendingPlannerAction] = useState<null | "open_task" | "open_ai">(null)
  const canUsePlanner = canAccessFeature(subscription, "planner")
  const activePlanName = subscription?.plan_id === "premium" ? "Premium" : subscription?.plan_id === "pro" ? "Pro" : null

  const guardPlannerAccess = (action: "open_task" | "open_ai") => {
    if (isLoading) {
      setPendingPlannerAction(action)
      return false
    }
    if (userError === "not_authenticated" || !email) {
      setShowLoginModal(true)
      return false
    }
    if (!canUsePlanner) {
      setShowPlanModal(true)
      return false
    }
    return true
  }

  const toggleTask = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
  }

  const handleAddTask = () => {
    if (!guardPlannerAccess("open_task")) return
    if (!newTaskTitle.trim() || !newTaskTime || !newTaskSubject.trim()) {
      return
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      time: newTaskTime,
      duration: newTaskDuration,
      subject: newTaskSubject,
      completed: false,
    }

    setTasks([...tasks, newTask])
    setNewTaskTitle("")
    setNewTaskTime("")
    setNewTaskDuration("1h")
    setNewTaskSubject("")
    setIsAddingTask(false)
  }

  const toggleAISuggestion = (index: number) => {
    setAiSuggestions(
      aiSuggestions.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    )
  }

  const handleApplySchedule = () => {
    const selectedItems = aiSuggestions.filter((item) => item.selected)
    
    const newTasks = selectedItems.map((item) => ({
      id: Date.now().toString() + Math.random(),
      title: item.activity,
      time: item.time.split(" - ")[0],
      duration: "1h",
      subject: item.activity.split("(")[0].trim(),
      completed: false,
    }))

    setTasks([...tasks, ...newTasks])
    setAiSuggestions(aiSuggestionsData)
    setShowAISuggestions(false)
  }

  const handleGenerateAIPlan = async () => {
    if (!aiGoal.trim()) return
    if (!guardPlannerAccess("open_ai")) return
    setAiLoading(true)
    try {
      const prompt = `You are a study planner AI. Create a daily study schedule for a student.
Goal: ${aiGoal}
Available study hours today: ${aiHours} hours
Current time: ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}

Return ONLY a valid JSON array. No markdown, no backticks:
[{"time":"09:00 - 10:30","activity":"Subject Name (specific task)","reason":"Why this timing is optimal"}]

Generate 5-6 schedule items that fit within ${aiHours} hours total. Make times realistic and specific to the goal.`

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      })
      const data = await res.json()
      if (!res.ok) return

      const cleaned = data.reply.replace(/\`\`\`json\s*/g, "").replace(/\`\`\`\s*/g, "").trim()
      const parsed = JSON.parse(cleaned)
      if (Array.isArray(parsed)) {
        setAiSuggestions(parsed.map((item: AIScheduleItem) => ({ ...item, selected: false })))
        setAiGenerated(true)
      }
    } catch {
      // fallback to static data on parse error
      setAiSuggestions(aiSuggestionsData.map(s => ({ ...s, selected: false })))
      setAiGenerated(true)
    } finally {
      setAiLoading(false)
    }
  }


  useEffect(() => {
    if (!pendingPlannerAction || isLoading) return

    const action = pendingPlannerAction
    setPendingPlannerAction(null)

    if (userError === "not_authenticated" || !email) {
      setShowLoginModal(true)
      return
    }

    if (!canUsePlanner) {
      setShowPlanModal(true)
      return
    }

    if (action === "open_task") {
      setIsAddingTask(true)
      return
    }

    setShowAISuggestions(true)
  }, [pendingPlannerAction, isLoading, userError, email, canUsePlanner])


  return (
    <>
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Study Planner</h1>
          <p className="text-muted-foreground">Plan and organize your study schedule</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => {
            if (!guardPlannerAccess("open_ai")) return
            setShowAISuggestions(true)
          }}>
            <Sparkles className="h-4 w-4" />
            AI Planner
          </Button>
          <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={(e) => {
                if (!guardPlannerAccess("open_task")) {
                  e.preventDefault()
                  return
                }
                setIsAddingTask(true)
              }}>
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
                    <Select value={newTaskDuration} onValueChange={setNewTaskDuration}>
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
                <Button className="w-full" onClick={handleAddTask}>
                  Add Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {activePlanName ? (
        <Card className="border-emerald-500/30 bg-emerald-500/10">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <Crown className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <div>
              <p className="font-medium text-foreground">You are on {activePlanName} Plan.</p>
              <p className="mt-1 text-muted-foreground">Your premium features are now active across the app.</p>
            </div>
          </CardContent>
        </Card>
      ) : !canUsePlanner ? (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <Crown className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="font-medium text-foreground">Planner is a Premium feature.</p>
              <p className="mt-1 text-muted-foreground">Upgrade to Premium to unlock Planner instantly after successful payment.</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
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

        {/* Tasks List */}
        <Card className="lg:col-span-2 border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">March {selectedDay}, 2026</CardTitle>
                <p className="text-xs text-muted-foreground">{tasks.length} tasks scheduled</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.map((task) => (
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
            ))}
          </CardContent>
        </Card>
      </div>

      {/* AI Suggestions Modal */}
      <Dialog open={showAISuggestions} onOpenChange={(open) => { setShowAISuggestions(open); if (!open) { setAiGenerated(false); setAiGoal(""); } }}>
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
                <p className="text-sm text-muted-foreground">Tell the AI what you want to study today and it will create a personalized schedule.</p>
                <div className="space-y-2">
                  <Label>What do you want to study today?</Label>
                  <Input placeholder="e.g. Calculus, Machine Learning, History..." value={aiGoal} onChange={(e) => setAiGoal(e.target.value)} className="bg-secondary border-border" onKeyDown={(e) => e.key === "Enter" && handleGenerateAIPlan()} />
                </div>
                <div className="space-y-2">
                  <Label>Available hours today</Label>
                  <Select value={aiHours} onValueChange={setAiHours}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["2","3","4","5","6","8"].map(h => <SelectItem key={h} value={h}>{h} hours</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowAISuggestions(false)}>Cancel</Button>
                  <Button className="flex-1 gap-2" onClick={handleGenerateAIPlan} disabled={!aiGoal.trim() || aiLoading}>
                    {aiLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Generating...</> : <><Sparkles className="h-4 w-4" />Generate Plan</>}
                  </Button>
                </div>
              </div>
            ) : (
              <>
            <p className="text-sm text-muted-foreground">
              Here&apos;s your AI-generated study schedule. Select sessions to add to your planner:
            </p>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {aiSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => toggleAISuggestion(index)}
                  className={cn(
                    "flex items-start gap-4 p-3 rounded-lg transition-all border-2 text-left",
                    suggestion.selected
                      ? "bg-primary/10 border-primary"
                      : "bg-secondary/50 border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div
                      className={cn(
                        "h-5 w-5 rounded border-2 flex items-center justify-center transition-all",
                        suggestion.selected
                          ? "bg-primary border-primary"
                          : "border-muted-foreground"
                      )}
                    >
                      {suggestion.selected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-primary mb-1">
                      {suggestion.time}
                    </div>
                    <p className="font-medium text-foreground">{suggestion.activity}</p>
                    <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setAiGenerated(false); setAiGoal(""); }}>
                ← Back
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleApplySchedule}
                disabled={!aiSuggestions.some((item) => item.selected)}
              >
                <Check className="h-4 w-4" />
                Apply Selected ({aiSuggestions.filter((item) => item.selected).length})
              </Button>
            </div>
          </>
          )}
          </div>
        </DialogContent>
      </Dialog>
    </div>

      <LoginGateModal open={showLoginModal} onOpenChange={setShowLoginModal} featureName="Study Planner" />
      <ChoosePlanModal
        open={showPlanModal}
        onOpenChange={setShowPlanModal}
        onPaymentSuccess={async () => {
          setShowPlanModal(false)
          await refetch()
          setShowPlanModal(false)
          setPendingPlannerAction(null)
        }}
      />
    </>
  )
}
