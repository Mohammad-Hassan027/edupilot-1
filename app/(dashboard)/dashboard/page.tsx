import { QuickStats } from "@/components/dashboard/quick-stats"
import { RecentTopics } from "@/components/dashboard/recent-topics"
import { StudyAnalytics } from "@/components/dashboard/study-analytics"
import { QuizScores } from "@/components/dashboard/quiz-scores"
import { SavedNotesCard } from "@/components/dashboard/saved-notes-card"
import { MonthlyActivityCard } from "@/components/dashboard/monthly-activity-card"
import { FeatureUsageCard } from "@/components/dashboard/feature-usage-card"
import { TodaysSessionsCard } from "@/components/dashboard/todays-sessions-card"

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <QuickStats />
      <TodaysSessionsCard />
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentTopics />
        </div>
        <div className="lg:col-span-1">
          <StudyAnalytics />
        </div>
        <div className="lg:col-span-1">
          <QuizScores />
        </div>
        <div className="lg:col-span-2 xl:col-span-1">
          <SavedNotesCard />
        </div>
        <div className="lg:col-span-2 xl:col-span-3">
          <FeatureUsageCard />
        </div>
        <div className="lg:col-span-2 xl:col-span-3">
          <MonthlyActivityCard />
        </div>
      </div>
    </div>
  )
}
