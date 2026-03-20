import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth-server"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

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
