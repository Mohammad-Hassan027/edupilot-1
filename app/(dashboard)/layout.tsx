import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"

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
