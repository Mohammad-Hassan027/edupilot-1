"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bell, Search, Sparkles, Menu, X, Home, LayoutDashboard, MessageSquareText, FileText,
  Layers, HelpCircle, Calendar, BookOpen, Settings, Mic, User, CreditCard,
  LogOut, Clock, TrendingUp, Lightbulb, Zap
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/logo"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { NotificationsDropdown } from "./notifications-dropdown"
import { useUser } from "@/hooks/use-user"

const mobileNavItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: MessageSquareText, label: "AI Tutor", href: "/ai-tutor" },
  { icon: FileText, label: "Notes", href: "/notes" },
  { icon: Layers, label: "Flashcards", href: "/flashcards" },
  { icon: Mic, label: "AI Voice", href: "/ai-voice" },
  { icon: HelpCircle, label: "Quiz", href: "/quiz" },
  { icon: Calendar, label: "Planner", href: "/planner" },
  { icon: BookOpen, label: "Blogs", href: "/blogs" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

const recentSearches = ["JavaScript basics", "Time management"]

const suggestedTopics = [
  { icon: TrendingUp, label: "Learning productivity" },
  { icon: Lightbulb, label: "UI design principles" },
  { icon: BookOpen, label: "Interview preparation" },
  { icon: MessageSquareText, label: "Data analysis basics" },
]

const searchResultTypes = [
  { type: "note", icon: FileText, label: "Notes" },
  { type: "flashcard", icon: Layers, label: "Flashcards" },
  { type: "quiz", icon: HelpCircle, label: "Quizzes" },
]

function getPlanLabel(status: string | undefined, trialActive: boolean): string {
  if (trialActive) return "Trial"
  if (status === "active") return "Pro Plan"
  if (status === "trial") return "Trial"
  return "Free Plan"
}

export function DashboardHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const { profile, email, subscription, credits, isLoading, fullName, error } = useUser()
  const isGuest = error === "not_authenticated"

  const displayName = fullName || profile?.full_name || email?.split("@")[0] || "User"
  const firstName = displayName.split(" ")[0]
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
  const avatarSeed = email || displayName
  const planLabel = getPlanLabel(subscription?.status, subscription?.trial_active ?? false)
  const aiCreditsLeft = credits?.ai_chat_remaining ?? 0

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleAskAI = () => router.push("/ai-tutor")

  const handleSearchSelect = (topic: string) => {
    setSearchQuery(topic)
    setSearchOpen(false)
  }

  const handleAskAIAboutTopic = (topic: string) => {
    router.push(`/ai-tutor?q=${encodeURIComponent(topic)}`)
    setSearchOpen(false)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
      router.refresh()
    } catch {
      router.push("/")
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Shared user menu items (used in both desktop + mobile dropdowns)
  const userMenuItems = (
    <>
      <DropdownMenuLabel className="font-normal">
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-medium leading-none text-foreground">
            {isLoading ? "Loading..." : displayName}
          </p>
          <p className="text-xs leading-none text-muted-foreground">
            {isLoading ? "" : email ?? ""}
          </p>
        </div>
      </DropdownMenuLabel>

      {/* Credits indicator */}
      {!isLoading && subscription?.status === "free" && (
        <>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5">
            <div className="flex items-center justify-between rounded-md bg-primary/10 px-2 py-1.5">
              <div className="flex items-center gap-1.5 text-xs text-primary">
                <Zap className="h-3 w-3" />
                <span>AI Credits</span>
              </div>
              <span className="text-xs font-semibold text-primary">{aiCreditsLeft} left</span>
            </div>
          </div>
        </>
      )}

      <DropdownMenuSeparator />
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link href="/profile" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          My Profile
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link href="/settings" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link href="/billing" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Billing
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="cursor-pointer">
        <Link href="/help-center" className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          Help Center
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="cursor-pointer text-destructive focus:text-destructive"
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        <LogOut className="h-4 w-4 mr-2" />
        {isLoggingOut ? "Logging out..." : "Logout"}
      </DropdownMenuItem>
    </>
  )

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 md:px-6 backdrop-blur-xl">
        {/* Mobile Menu Button & Logo */}
        <div className="flex items-center gap-3 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-muted-foreground"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Logo size="sm" />
        </div>

        {/* Welcome Message - Desktop */}
        <div className="hidden md:block">
          <h1 className="text-xl font-semibold text-foreground">
            {isGuest ? (
              <>Welcome to{" "}<span className="text-primary">EduPilot</span></>
            ) : (
              <>Welcome back,{" "}<span className="text-primary">{isLoading ? "..." : firstName}</span></>
            )}
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Smart Search with Dropdown */}
          <div className="relative hidden md:block" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
            <Input
              placeholder="Search topics, skills, concepts..."
              className="w-64 border-border bg-secondary pl-10 text-foreground placeholder:text-muted-foreground"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
            />

            {/* Search Dropdown */}
            {searchOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-lg border border-border bg-card/95 backdrop-blur-xl shadow-xl overflow-hidden z-50">
                {searchQuery ? (
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                      Search results for &quot;{searchQuery}&quot;
                    </div>
                    {searchResultTypes.map((type) => (
                      <button
                        key={type.type}
                        onClick={() => handleSearchSelect(searchQuery)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md hover:bg-secondary transition-colors text-left"
                      >
                        <type.icon className="h-4 w-4 text-primary" />
                        <span className="text-sm text-foreground">{searchQuery}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{type.label}</span>
                      </button>
                    ))}
                    <div className="border-t border-border mt-2 pt-2">
                      <button
                        onClick={() => handleAskAIAboutTopic(searchQuery)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md hover:bg-accent/10 transition-colors text-left"
                      >
                        <Sparkles className="h-4 w-4 text-accent" />
                        <span className="text-sm text-accent">Ask AI about this topic</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-2">
                    {recentSearches.length > 0 && (
                      <div className="mb-3">
                        <div className="px-3 py-2 text-xs font-medium text-muted-foreground flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          Recent searches
                        </div>
                        {recentSearches.map((search) => (
                          <button
                            key={search}
                            onClick={() => handleSearchSelect(search)}
                            className="flex items-center gap-3 w-full px-3 py-2 rounded-md hover:bg-secondary transition-colors text-left"
                          >
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{search}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div>
                      <div className="px-3 py-2 text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <Lightbulb className="h-3 w-3" />
                        Suggested topics
                      </div>
                      {suggestedTopics.map((topic) => (
                        <button
                          key={topic.label}
                          onClick={() => handleSearchSelect(topic.label)}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-md hover:bg-secondary transition-colors text-left"
                        >
                          <topic.icon className="h-4 w-4 text-primary" />
                          <span className="text-sm text-foreground">{topic.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick AI Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAskAI}
                  className="hidden gap-2 border-accent/50 bg-accent/10 text-accent hover:bg-accent/20 hover:text-accent hover:shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all sm:flex"
                >
                  <Sparkles className="h-4 w-4" />
                  Ask AI
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-card border-border">
                <p>Open AI Tutor</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications Dropdown */}
          <NotificationsDropdown />

          {/* Desktop User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden sm:flex items-center gap-3 rounded-full border border-border bg-secondary py-1.5 pl-1.5 pr-4 hover:border-primary/50 hover:bg-secondary/80 transition-all cursor-pointer">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                    alt={displayName}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium leading-none text-foreground">
                    {isLoading ? "Loading..." : displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">{planLabel}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border">
              {userMenuItems}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Avatar with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 sm:hidden cursor-pointer">
                <AvatarImage
                  src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                  alt={displayName}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border">
              {userMenuItems}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 border-r border-border bg-card">
            <div className="flex h-16 items-center border-b border-border px-4">
              <Logo size="sm" />
            </div>
            <nav className="p-4 space-y-1">
              {mobileNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
