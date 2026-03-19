"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  LayoutDashboard,
  Calendar,
  FileText,
  Layers,
  HelpCircle as QuizIcon,
  Mic,
  BookOpen,
  Settings,
  HelpCircle,
  Sparkles,
  MessageSquareText,
  User,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Logo } from "@/components/logo"

const navItems = [
  { icon: Home, label: "Home", href: "/", external: true },
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: MessageSquareText, label: "AI Tutor", href: "/ai-tutor", highlight: true },
  { icon: FileText, label: "Notes", href: "/notes" },
  { icon: Layers, label: "Flashcards", href: "/flashcards" },
  { icon: Mic, label: "AI Voice", href: "/ai-voice" },
  { icon: QuizIcon, label: "Quiz", href: "/quiz" },
  { icon: Calendar, label: "Planner", href: "/planner" },
  { icon: BookOpen, label: "Blogs", href: "/blogs", external: true },
]

const bottomItems = [
  { icon: User, label: "Profile", href: "/profile" },
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: HelpCircle, label: "Help Center", href: "/help-center", external: true },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  
  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className="fixed left-0 top-0 z-40 h-screen flex-col border-r border-border bg-card/50 backdrop-blur-xl transition-all duration-300 hidden md:flex lg:w-64 w-[72px]"
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border px-4">
          <div className="hidden lg:block">
            <Logo size="sm" />
          </div>
          <div className="lg:hidden">
            <Logo size="sm" showText={false} />
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all lg:justify-start justify-center",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      item.highlight && !isActive && "text-primary hover:text-primary"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 shrink-0", item.highlight && !isActive && "text-primary")} />
                    <span className="hidden lg:inline">{item.label}</span>
                    {item.highlight && (
                      <Sparkles className="ml-auto h-4 w-4 text-primary hidden lg:block" />
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-card border-border lg:hidden">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="mt-auto space-y-1 border-t border-border px-3 py-4">
          {bottomItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all lg:justify-start justify-center",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-card border-border lg:hidden">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </aside>
    </TooltipProvider>
  )
}
