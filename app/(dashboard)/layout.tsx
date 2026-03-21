import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"

// Note: individual protected routes (/notes, /quiz, etc.) are blocked by middleware.
// The /dashboard route itself is intentionally viewable by guests (read-only view).
// All AI features inside the dashboard components check auth before calling APIs.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="lg:pl-64 md:pl-[72px] transition-all duration-300">
        <DashboardHeader />
        {children}
      </main>
    </div>
  )
}
