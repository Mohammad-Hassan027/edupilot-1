import { QuickStats } from "@/components/dashboard/quick-stats"
import { RecentTopics } from "@/components/dashboard/recent-topics"
import { StudyAnalytics } from "@/components/dashboard/study-analytics"
import { QuizScores } from "@/components/dashboard/quiz-scores"
import { CreditStatus } from "@/components/dashboard/credit-status"

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <QuickStats />
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentTopics />
        </div>
        <div>
          <CreditStatus />
        </div>
        <div className="lg:col-span-1">
          <StudyAnalytics />
        </div>
        <div className="lg:col-span-1">
          <QuizScores />
        </div>
      </div>
    </div>
  )
}
