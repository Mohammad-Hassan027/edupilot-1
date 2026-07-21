"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  LayoutDashboard,
  Calendar,
  FileText,
  Layers,
  HelpCircle as QuizIcon,
  Mic,
  Network,
  BookOpen,
  Settings,
  HelpCircle,
  Sparkles,
  MessageSquareText,
  User,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  Trophy,
  Clock,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { useUser } from "@/hooks/use-user"

const navItems = [
  { icon: Home,              label: "Home",       href: "/",           external: true,  guestOk: true  },
  { icon: LayoutDashboard,   label: "Dashboard",  href: "/dashboard",                   guestOk: true  },
  { icon: MessageSquareText, label: "AI Tutor",   href: "/ai-tutor",   highlight: true, guestOk: true  },
  { icon: FileText,          label: "Notes",      href: "/notes",                        guestOk: false },
  { icon: Layers,            label: "Flashcards", href: "/flashcards",                   guestOk: false },
  { icon: Mic,               label: "AI Voice",   href: "/ai-voice",                     guestOk: false },
  { icon: QuizIcon,          label: "Quiz",       href: "/quiz",                         guestOk: false },
  { icon: Network,           label: "Concept Map",href: "/concept-map",                  guestOk: false },
  { icon: Calendar,          label: "Planner",    href: "/planner",                      guestOk: false },
  { icon: Clock,             label: "Revision",   href: "/revision",                     guestOk: false },
  { icon: Sparkles,          label: "Topic Analyzer", href: "/topic-analyzer",           guestOk: false },
  { icon: BookOpen,          label: "Blogs",      href: "/blogs",      external: true,  guestOk: true  },
]

const bottomItems = [
  { icon: User,       label: "Profile",     href: "/profile",     guestOk: false },
  { icon: Settings,   label: "Settings",    href: "/settings",    guestOk: false },
  { icon: HelpCircle, label: "Help Center", href: "/help-center", guestOk: true  },
]

type Props = {
  collapsed: boolean
  onToggle: () => void
}

export function DashboardSidebar({ collapsed, onToggle }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { email, isLoading, error } = useUser()

  const isGuest = !isLoading && (error === "not_authenticated" || !email)

  const handleNavClick = (item: typeof navItems[0], e: React.MouseEvent) => {
    if (!item.guestOk && isGuest) {
      e.preventDefault()
      router.push("/login")
    }
  }

  const renderItem = (item: typeof navItems[0]) => {
    const isActive = pathname === item.href
    const isLocked = !item.guestOk && isGuest
    const Icon = item.icon

    return (
      <Tooltip key={item.label}>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            onClick={(e) => handleNavClick(item, e)}
            className={cn(
              "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all relative",
              collapsed ? "justify-center" : "gap-3 justify-start",
              isActive
                ? "bg-primary/10 text-primary"
                : isLocked
                  ? "text-muted-foreground/50 hover:bg-secondary hover:text-muted-foreground cursor-pointer"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              item.highlight && !isActive && !isLocked && "text-primary hover:text-primary"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 shrink-0",
                item.highlight && !isActive && !isLocked && "text-primary",
                isLocked && "opacity-50"
              )}
            />

            {!collapsed && (
              <span className="truncate">{item.label}</span>
            )}

            {!collapsed && item.highlight && !isActive && !isLocked && (
              <Sparkles className="ml-auto h-4 w-4 text-primary shrink-0" />
            )}

            {!collapsed && isLocked && (
              <Lock className="ml-auto h-3 w-3 text-muted-foreground/50 shrink-0" />
            )}
          </Link>
        </TooltipTrigger>

        {collapsed && (
          <TooltipContent
            side="right"
            className="bg-[#111827] text-white border border-white/10 shadow-xl px-3 py-1.5"
          >
            {isLocked ? `${item.label} — Login required` : item.label}
          </TooltipContent>
        )}
      </Tooltip>
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-border bg-card/50 backdrop-blur-xl transition-all duration-300 hidden md:flex flex-col",
          collapsed ? "w-[92px]" : "w-64"
        )}
      >
      <div className="h-20 border-b border-border">
        {collapsed ? (
          <div className="grid h-full grid-cols-[40px_1fr] items-center px-3">
            <div className="flex items-center justify-center">
              <Logo
                size="sm"
                showText={false}
                href="/dashboard"
                className="!gap-0"
              />
            </div>

            <div className="flex items-center justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="h-8 w-8 shrink-0 text-foreground hover:bg-secondary"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-between px-4 overflow-hidden">
            <div className="min-w-0 flex-1 overflow-hidden">
              <Logo
                size="sm"
                showText={true}
                href="/dashboard"
                className="shrink-0"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="ml-2 shrink-0 text-foreground hover:bg-secondary"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map(renderItem)}
        </nav>

        <div className="mt-auto space-y-1 border-t border-border px-3 py-4">
          {bottomItems.map(renderItem)}
        </div>
      </aside>
    </TooltipProvider>
  )
}