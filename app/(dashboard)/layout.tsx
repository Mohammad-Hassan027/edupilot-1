// import { DashboardSidebar } from "@/components/dashboard/sidebar"
// import { DashboardHeader } from "@/components/dashboard/header"

// // Note: individual protected routes (/notes, /quiz, etc.) are blocked by middleware.
// // The /dashboard route itself is intentionally viewable by guests (read-only view).
// // All AI features inside the dashboard components check auth before calling APIs.
// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <div className="min-h-screen bg-background">
//       <DashboardSidebar />
//       <main className="lg:pl-64 md:pl-[72px] transition-all duration-300">
//         <DashboardHeader />
//         {children}
//       </main>
//     </div>
//   )
// }
"use client"

import { useEffect, useState } from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem("edupilot-sidebar-collapsed")
    if (saved === "true") setCollapsed(true)
  }, [])

  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      window.localStorage.setItem("edupilot-sidebar-collapsed", String(next))
      return next
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar collapsed={collapsed} onToggle={handleToggle} />

      <main
        className={cn(
          "transition-all duration-300",
          collapsed ? "md:pl-[88px]" : "md:pl-64"
        )}
      >
        <DashboardHeader />
        {children}
      </main>
    </div>
  )
}