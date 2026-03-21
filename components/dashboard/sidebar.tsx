"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home, LayoutDashboard, Calendar, FileText, Layers, HelpCircle as QuizIcon,
  Mic, BookOpen, Settings, HelpCircle, Sparkles, MessageSquareText, User, Lock
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Logo } from "@/components/logo"
import { createClient } from "@supabase/supabase-js"
import { useState, useEffect } from "react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const navItems = [
  { icon: Home,              label: "Home",       href: "/",          external: true,  guestOk: true  },
  { icon: LayoutDashboard,   label: "Dashboard",  href: "/dashboard",                  guestOk: true  },
  { icon: MessageSquareText, label: "AI Tutor",   href: "/ai-tutor",  highlight: true, guestOk: false },
  { icon: FileText,          label: "Notes",      href: "/notes",                      guestOk: false },
  { icon: Layers,            label: "Flashcards", href: "/flashcards",                 guestOk: false },
  { icon: Mic,               label: "AI Voice",   href: "/ai-voice",                   guestOk: false },
  { icon: QuizIcon,          label: "Quiz",       href: "/quiz",                       guestOk: false },
  { icon: Calendar,          label: "Planner",    href: "/planner",                    guestOk: false },
  { icon: BookOpen,          label: "Blogs",      href: "/blogs",     external: true,  guestOk: true  },
]

const bottomItems = [
  { icon: User,        label: "Profile",     href: "/profile",     guestOk: false },
  { icon: Settings,    label: "Settings",    href: "/settings",    guestOk: false },
  { icon: HelpCircle,  label: "Help Center", href: "/help-center", guestOk: true  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setIsLoggedIn(!!s?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleNavClick = (item: typeof navItems[0], e: React.MouseEvent) => {
    if (!item.guestOk && isLoggedIn === false) {
      e.preventDefault()
      router.push("/login")
    }
  }

  const renderItem = (item: typeof navItems[0]) => {
    const isActive   = pathname === item.href
    const isLocked   = !item.guestOk && isLoggedIn === false
    const Icon       = item.icon

    return (
      <Tooltip key={item.label}>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            onClick={(e) => handleNavClick(item, e)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all lg:justify-start justify-center relative",
              isActive
                ? "bg-primary/10 text-primary"
                : isLocked
                  ? "text-muted-foreground/50 hover:bg-secondary hover:text-muted-foreground cursor-pointer"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              item.highlight && !isActive && !isLocked && "text-primary hover:text-primary"
            )}
          >
            <Icon className={cn("h-5 w-5 shrink-0",
              item.highlight && !isActive && !isLocked && "text-primary",
              isLocked && "opacity-50"
            )} />
            <span className="hidden lg:inline">{item.label}</span>
            {item.highlight && !isActive && !isLocked && (
              <Sparkles className="ml-auto h-4 w-4 text-primary hidden lg:block" />
            )}
            {isLocked && (
              <Lock className="ml-auto h-3 w-3 text-muted-foreground/50 hidden lg:block" />
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-card border-border lg:hidden">
          {isLocked ? `${item.label} — Login required` : item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="fixed left-0 top-0 z-40 h-screen flex-col border-r border-border bg-card/50 backdrop-blur-xl transition-all duration-300 hidden md:flex lg:w-64 w-[72px]">
        <div className="flex h-16 items-center border-b border-border px-4">
          <div className="hidden lg:block"><Logo size="sm" href="/dashboard" /></div>
          <div className="lg:hidden"><Logo size="sm" showText={false} href="/dashboard" /></div>
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
