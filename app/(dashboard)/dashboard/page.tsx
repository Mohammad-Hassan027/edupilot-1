import { QuickStats } from "@/components/dashboard/quick-stats"
import { StudyAnalytics } from "@/components/dashboard/study-analytics"
import { AITutor } from "@/components/dashboard/ai-tutor"
import { StudyPlanner } from "@/components/dashboard/study-planner"
import { TaskList } from "@/components/dashboard/task-list"
import { QuizScores } from "@/components/dashboard/quiz-scores"

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Quick Stats */}
      <QuickStats />

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* AI Tutor - Takes more space */}
        <div className="xl:col-span-2">
          <AITutor />
        </div>

        {/* Study Analytics */}
        <div className="lg:col-span-1">
          <StudyAnalytics />
        </div>

        {/* Quiz Scores */}
        <div className="lg:col-span-1">
          <QuizScores />
        </div>

        {/* Study Planner */}
        <div className="lg:col-span-1 xl:col-span-2">
          <StudyPlanner />
        </div>

        {/* Task List */}
        <div className="lg:col-span-1">
          <TaskList />
        </div>
      </div>
    </div>
  )
}
