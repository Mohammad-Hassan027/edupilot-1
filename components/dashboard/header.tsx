"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bell, Search, Sparkles, Menu, X, Home, LayoutDashboard, MessageSquareText, FileText,
  Layers, HelpCircle, Calendar, BookOpen, Settings, Mic, User, CreditCard,
  LogOut, Clock, TrendingUp, Lightbulb, LogIn, Lock, ArrowRight
} from "lucide-react"
import { UserAvatar } from "@/components/user-avatar"
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
  { icon: Home, label: "Home", href: "/", guestOk: true },
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", guestOk: true },
  { icon: MessageSquareText, label: "AI Tutor", href: "/ai-tutor", guestOk: true },
  { icon: FileText, label: "Notes", href: "/notes", guestOk: false },
  { icon: Layers, label: "Flashcards", href: "/flashcards", guestOk: false },
  { icon: Mic, label: "AI Voice", href: "/ai-voice", guestOk: false },
  { icon: HelpCircle, label: "Quiz", href: "/quiz", guestOk: false },
  { icon: Calendar, label: "Planner", href: "/planner", guestOk: false },
  { icon: BookOpen, label: "Blogs", href: "/blogs", guestOk: true },
  { icon: Settings, label: "Settings", href: "/settings", guestOk: false },
]

type SearchItem = {
  id: string
  title: string
  subtitle?: string
  href?: string
  query?: string
  icon: typeof Search
  category: "feature" | "note" | "flashcard" | "quiz" | "voice" | "topic" | "recent"
  guestOk?: boolean
}

type NoteSearchItem = {
  id: string
  source_title?: string
  source_label?: string | null
  source_type?: string
}

type FlashcardSearchItem = {
  id: string
  topic?: string
  card_count?: number
}

type QuizSearchItem = {
  id: string
  topic?: string
  score?: number
  percentage?: number
}

type VoiceSearchItem = {
  id: string
  title?: string
  prompt?: string
}

const FEATURE_ITEMS: SearchItem[] = [
  { id: "feature-home", title: "Home", subtitle: "Go to homepage", href: "/", icon: Home, category: "feature", guestOk: true },
  { id: "feature-dashboard", title: "Dashboard", subtitle: "Open your dashboard", href: "/dashboard", icon: LayoutDashboard, category: "feature", guestOk: true },
  { id: "feature-ai-tutor", title: "AI Tutor", subtitle: "Ask anything with AI", href: "/ai-tutor", icon: MessageSquareText, category: "feature", guestOk: true },
  { id: "feature-notes", title: "Notes", subtitle: "Generate study notes", href: "/notes", icon: FileText, category: "feature", guestOk: false },
  { id: "feature-flashcards", title: "Flashcards", subtitle: "Review saved flashcards", href: "/flashcards", icon: Layers, category: "feature", guestOk: false },
  { id: "feature-ai-voice", title: "AI Voice", subtitle: "Practice with voice", href: "/ai-voice", icon: Mic, category: "feature", guestOk: false },
  { id: "feature-quiz", title: "Quiz", subtitle: "Generate and review quizzes", href: "/quiz", icon: HelpCircle, category: "feature", guestOk: false },
  { id: "feature-planner", title: "Planner", subtitle: "Create study plans", href: "/planner", icon: Calendar, category: "feature", guestOk: false },
  { id: "feature-blogs", title: "Blogs", subtitle: "Read study blogs", href: "/blogs", icon: BookOpen, category: "feature", guestOk: true },
  { id: "feature-billing", title: "Billing", subtitle: "Manage your plan", href: "/billing", icon: CreditCard, category: "feature", guestOk: false },
  { id: "feature-profile", title: "Profile", subtitle: "View your profile", href: "/profile", icon: User, category: "feature", guestOk: false },
  { id: "feature-settings", title: "Settings", subtitle: "Change your preferences", href: "/settings", icon: Settings, category: "feature", guestOk: false },
]

const suggestedTopics: SearchItem[] = [
  { id: "topic-javascript", title: "JavaScript basics", subtitle: "Ask AI Tutor about JavaScript fundamentals", query: "Explain JavaScript basics for a beginner with examples.", icon: TrendingUp, category: "topic", guestOk: true },
  { id: "topic-time", title: "Time management", subtitle: "Get tips for studying better", query: "Give me practical time management tips for students.", icon: Clock, category: "topic", guestOk: true },
  { id: "topic-productivity", title: "Learning productivity", subtitle: "Improve focus and retention", query: "How can I improve learning productivity and focus while studying?", icon: TrendingUp, category: "topic", guestOk: true },
  { id: "topic-ui", title: "UI design principles", subtitle: "Learn core design concepts", query: "Teach me UI design principles in a simple way.", icon: Lightbulb, category: "topic", guestOk: true },
  { id: "topic-interview", title: "Interview preparation", subtitle: "Practice interview topics", query: "Help me prepare for interviews with a study plan and sample questions.", icon: BookOpen, category: "topic", guestOk: true },
  { id: "topic-data", title: "Data analysis basics", subtitle: "Understand core analytics concepts", query: "Explain data analysis basics for a student.", icon: MessageSquareText, category: "topic", guestOk: true },
]

const RECENT_SEARCHES_KEY = "edupilot_recent_searches"

function getPlanLabel(status: string | undefined, trialActive: boolean, planId?: string | null): string {
  const paidLabel = planId === "premium" ? "Premium" : "Pro"
  if (trialActive || status === "trial") return `${paidLabel} Trial`
  if (status === "active") return `${paidLabel} Plan`
  return "Free Plan"
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase()
}

function matchesQuery(query: string, ...values: Array<string | null | undefined>) {
  const normalizedQuery = normalizeValue(query)
  if (!normalizedQuery) return true
  return values.some((value) => normalizeValue(value || "").includes(normalizedQuery))
}

export function DashboardHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [savedNotes, setSavedNotes] = useState<NoteSearchItem[]>([])
  const [savedFlashcards, setSavedFlashcards] = useState<FlashcardSearchItem[]>([])
  const [savedQuizzes, setSavedQuizzes] = useState<QuizSearchItem[]>([])
  const [savedVoiceHistory, setSavedVoiceHistory] = useState<VoiceSearchItem[]>([])
  const [isLoadingSearchData, setIsLoadingSearchData] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const { profile, email, subscription, isLoading, fullName, error } = useUser()
  const isGuest = !isLoading && (error === "not_authenticated" || !email)

  const displayName = fullName || profile?.full_name || email?.split("@")[0] || "User"
  const firstName = displayName.split(" ")[0]
  const planLabel = getPlanLabel(subscription?.status, subscription?.trial_active ?? false, subscription?.plan_id)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const stored = window.localStorage.getItem(RECENT_SEARCHES_KEY)
      if (!stored) return
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.filter((item): item is string => typeof item === "string").slice(0, 6))
      }
    } catch {
      setRecentSearches([])
    }
  }, [])

  useEffect(() => {
    if (isGuest || !searchOpen) return

    let cancelled = false

    const loadSearchData = async () => {
      setIsLoadingSearchData(true)
      try {
        const [notesRes, flashcardsRes, quizzesRes, voiceRes] = await Promise.allSettled([
          fetch("/api/ai/notes", { cache: "no-store" }),
          fetch("/api/ai/flashcards", { cache: "no-store" }),
          fetch("/api/ai/quiz", { cache: "no-store" }),
          fetch("/api/ai/voice", { cache: "no-store" }),
        ])

        if (cancelled) return

        if (notesRes.status === "fulfilled" && notesRes.value.ok) {
          const data = await notesRes.value.json()
          setSavedNotes(Array.isArray(data.notes) ? data.notes : [])
        }

        if (flashcardsRes.status === "fulfilled" && flashcardsRes.value.ok) {
          const data = await flashcardsRes.value.json()
          setSavedFlashcards(Array.isArray(data.sets) ? data.sets : [])
        }

        if (quizzesRes.status === "fulfilled" && quizzesRes.value.ok) {
          const data = await quizzesRes.value.json()
          setSavedQuizzes(Array.isArray(data.attempts) ? data.attempts : [])
        }

        if (voiceRes.status === "fulfilled" && voiceRes.value.ok) {
          const data = await voiceRes.value.json()
          setSavedVoiceHistory(Array.isArray(data.history) ? data.history : [])
        }
      } catch {
        if (!cancelled) {
          setSavedNotes([])
          setSavedFlashcards([])
          setSavedQuizzes([])
          setSavedVoiceHistory([])
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSearchData(false)
        }
      }
    }

    void loadSearchData()

    return () => {
      cancelled = true
    }
  }, [isGuest, searchOpen])

  const saveRecentSearch = (value: string) => {
    const cleaned = value.trim()
    if (!cleaned || typeof window === "undefined") return

    const next = [cleaned, ...recentSearches.filter((item) => normalizeValue(item) !== normalizeValue(cleaned))].slice(0, 6)
    setRecentSearches(next)
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
  }

  const historyResults = useMemo<SearchItem[]>(() => {
    const noteItems: SearchItem[] = savedNotes.map((item) => ({
      id: `note-${item.id}`,
      title: item.source_title || "Saved note",
      subtitle: item.source_label || "Open saved notes",
      href: `/notes?saved=${item.id}`,
      icon: FileText,
      category: "note",
      guestOk: false,
    }))

    const flashcardItems: SearchItem[] = savedFlashcards.map((item) => ({
      id: `flashcard-${item.id}`,
      title: item.topic || "Saved flashcards",
      subtitle: `${item.card_count || 0} cards`,
      href: `/flashcards?set=${item.id}`,
      icon: Layers,
      category: "flashcard",
      guestOk: false,
    }))

    const quizItems: SearchItem[] = savedQuizzes.map((item) => ({
      id: `quiz-${item.id}`,
      title: item.topic || "Saved quiz",
      subtitle: typeof item.percentage === "number" ? `Last score: ${item.percentage}%` : "Open saved quiz",
      href: `/quiz?attempt=${item.id}`,
      icon: HelpCircle,
      category: "quiz",
      guestOk: false,
    }))

    const voiceItems: SearchItem[] = savedVoiceHistory.map((item) => ({
      id: `voice-${item.id}`,
      title: item.title || item.prompt || "Saved voice prompt",
      subtitle: item.prompt || "Open AI Voice history",
      href: `/ai-voice?history=${item.id}`,
      icon: Mic,
      category: "voice",
      guestOk: false,
    }))

    return [...noteItems, ...flashcardItems, ...quizItems, ...voiceItems]
  }, [savedNotes, savedFlashcards, savedQuizzes, savedVoiceHistory])

  const filteredFeatureItems = useMemo(
    () => FEATURE_ITEMS.filter((item) => matchesQuery(searchQuery, item.title, item.subtitle)),
    [searchQuery]
  )

  const filteredHistoryItems = useMemo(
    () => historyResults.filter((item) => matchesQuery(searchQuery, item.title, item.subtitle)).slice(0, 8),
    [historyResults, searchQuery]
  )

  const filteredSuggestedTopics = useMemo(
    () => suggestedTopics.filter((item) => matchesQuery(searchQuery, item.title, item.subtitle)).slice(0, 6),
    [searchQuery]
  )

  const handleAskAI = () => router.push("/ai-tutor")

  const navigateToSearchItem = (item: SearchItem) => {
    if (!item.guestOk && isGuest) {
      router.push("/login")
      setSearchOpen(false)
      return
    }

    saveRecentSearch(item.title)
    setSearchQuery(item.title)
    setSearchOpen(false)

    if (item.href) {
      router.push(item.href)
      return
    }

    const topic = item.query || item.title
    router.push(`/ai-tutor?q=${encodeURIComponent(topic)}`)
  }

  const handleSearchSubmit = () => {
    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery) return

    const matchedFeature = FEATURE_ITEMS.find((item) => normalizeValue(item.title) === normalizeValue(trimmedQuery))
    if (matchedFeature) {
      navigateToSearchItem(matchedFeature)
      return
    }

    saveRecentSearch(trimmedQuery)
    setSearchOpen(false)
    router.push(`/ai-tutor?q=${encodeURIComponent(trimmedQuery)}`)
  }

  const handleMobileNavClick = (href: string, guestOk: boolean) => {
    setMobileMenuOpen(false)

    if (!guestOk && isGuest) {
      router.push("/login")
      return
    }

    router.push(href)
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

        <div className="hidden md:block">
          {isGuest ? (
            <h1 className="text-xl font-semibold text-foreground">
              Welcome to <span className="text-primary">EduPilot</span>
            </h1>
          ) : (
            <h1 className="text-xl font-semibold text-foreground">
              Welcome to EduPilot, <span className="text-primary">{isLoading ? "..." : firstName}</span>
            </h1>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
            <Input
              placeholder="Search topics, skills, concepts..."
              className="w-64 border-border bg-secondary pl-10 pr-10 text-foreground placeholder:text-muted-foreground"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleSearchSubmit()
                }
              }}
            />
            {searchQuery.trim() ? (
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Search"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}

            {searchOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 max-h-[28rem] overflow-y-auto rounded-lg border border-border bg-card/95 backdrop-blur-xl shadow-xl z-50">
                {searchQuery.trim() ? (
                  <div className="p-2">
                    {filteredFeatureItems.length > 0 && (
                      <div className="mb-2">
                        <div className="px-3 py-2 text-xs font-medium text-muted-foreground">Pages</div>
                        {filteredFeatureItems.slice(0, 6).map((item) => (
                          <button
                            key={item.id}
                            onClick={() => navigateToSearchItem(item)}
                            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-secondary"
                          >
                            <item.icon className="h-4 w-4 text-primary" />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm text-foreground">{item.title}</div>
                              {item.subtitle ? <div className="truncate text-xs text-muted-foreground">{item.subtitle}</div> : null}
                            </div>
                            <span className="text-xs text-muted-foreground">Page</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {!isGuest && filteredHistoryItems.length > 0 && (
                      <div className="mb-2">
                        <div className="px-3 py-2 text-xs font-medium text-muted-foreground">Your content</div>
                        {filteredHistoryItems.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => navigateToSearchItem(item)}
                            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-secondary"
                          >
                            <item.icon className="h-4 w-4 text-primary" />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm text-foreground">{item.title}</div>
                              {item.subtitle ? <div className="truncate text-xs text-muted-foreground">{item.subtitle}</div> : null}
                            </div>
                            <span className="text-xs text-muted-foreground capitalize">{item.category}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {filteredSuggestedTopics.length > 0 && (
                      <div className="border-t border-border pt-2">
                        <div className="px-3 py-2 text-xs font-medium text-muted-foreground">Suggested topics</div>
                        {filteredSuggestedTopics.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => navigateToSearchItem(item)}
                            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-secondary"
                          >
                            <item.icon className="h-4 w-4 text-primary" />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm text-foreground">{item.title}</div>
                              {item.subtitle ? <div className="truncate text-xs text-muted-foreground">{item.subtitle}</div> : null}
                            </div>
                            <span className="text-xs text-accent">Ask AI</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {filteredFeatureItems.length === 0 && filteredHistoryItems.length === 0 && filteredSuggestedTopics.length === 0 && (
                      <div className="p-3">
                        <button
                          onClick={handleSearchSubmit}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent/10"
                        >
                          <Sparkles className="h-4 w-4 text-accent" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm text-accent">Ask AI about “{searchQuery.trim()}”</div>
                            <div className="text-xs text-muted-foreground">Open AI Tutor with this prompt</div>
                          </div>
                        </button>
                      </div>
                    )}
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
                            onClick={() => {
                              setSearchQuery(search)
                              saveRecentSearch(search)
                            }}
                            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-secondary"
                          >
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{search}</span>
                          </button>
                        ))}
                        <div className="flex justify-end px-3 pt-1.5 border-t border-border/40 mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setRecentSearches([])
                              if (typeof window !== "undefined") {
                                window.localStorage.removeItem(RECENT_SEARCHES_KEY)
                              }
                            }}
                            className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                          >
                            Clear recent searches
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mb-3">
                      <div className="px-3 py-2 text-xs font-medium text-muted-foreground">Quick access</div>
                      {FEATURE_ITEMS.filter((item) => item.guestOk || !isGuest).slice(0, 6).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => navigateToSearchItem(item)}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-secondary"
                        >
                          <item.icon className="h-4 w-4 text-primary" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm text-foreground">{item.title}</div>
                            {item.subtitle ? <div className="truncate text-xs text-muted-foreground">{item.subtitle}</div> : null}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div>
                      <div className="px-3 py-2 text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <Lightbulb className="h-3 w-3" />
                        Suggested topics
                      </div>
                      {suggestedTopics.slice(0, 4).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => navigateToSearchItem(item)}
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-secondary"
                        >
                          <item.icon className="h-4 w-4 text-primary" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm text-foreground">{item.title}</div>
                            {item.subtitle ? <div className="truncate text-xs text-muted-foreground">{item.subtitle}</div> : null}
                          </div>
                        </button>
                      ))}
                    </div>

                    {!isGuest && (
                      <div className="border-t border-border mt-3 pt-3 px-3 pb-1 text-xs text-muted-foreground">
                        {isLoadingSearchData ? "Loading your notes, flashcards, quizzes, and voice history..." : "Search also checks your saved notes, flashcards, quizzes, and AI Voice history."}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

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
              <TooltipContent
                side="bottom"
                className="bg-[#111827] text-white border border-white/10 shadow-xl px-3 py-1.5"
              >
                Open AI Tutor
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <ThemeToggle />
          <NotificationsDropdown />

          {isGuest ? (
            <Link
              href="/login"
              className="hidden sm:flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-all"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden sm:flex items-center gap-3 rounded-full border border-border bg-secondary py-1.5 pl-1.5 pr-4 hover:border-primary/50 hover:bg-secondary/80 transition-all cursor-pointer">
                  <UserAvatar src={profile?.avatar_url} alt={displayName} className="h-8 w-8" />
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
          )}

          {isGuest ? (
            <Link href="/login" className="sm:hidden flex h-8 w-8 items-center justify-center rounded-full border border-primary/50 bg-primary/10 text-primary">
              <LogIn className="h-4 w-4" />
            </Link>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <UserAvatar src={profile?.avatar_url} alt={displayName} className="h-8 w-8 cursor-pointer sm:hidden" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                {userMenuItems}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 border-r border-border bg-card">
            <div className="flex h-16 items-center border-b border-border px-4">
              <Logo size="sm" />
            </div>
            <nav className="p-4 space-y-1">
              {mobileNavItems.map((item) => {
                const isLocked = isGuest && !item.guestOk

                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => handleMobileNavClick(item.href, item.guestOk)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                      isLocked
                        ? "text-muted-foreground/60 hover:bg-secondary hover:text-muted-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", isLocked && "opacity-60")} />
                    <span>{item.label}</span>
                    {isLocked ? <Lock className="ml-auto h-4 w-4 opacity-60" /> : null}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
