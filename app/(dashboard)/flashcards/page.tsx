"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  Shuffle,
  Sparkles,
  Loader2,
  Crown,
  Layers,
  History,
  Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LoginGateModal } from "@/components/login-gate-modal"
import { hasPaidAccess } from "@/lib/plans"
import { useUser } from "@/hooks/use-user"

interface Flashcard {
  id: string
  front: string
  back: string
  mastered: boolean
}

interface SavedFlashcardSet {
  id: string
  topic: string
  card_count: number
  cards: Array<{
    front: string
    back: string
  }>
  created_at: string
}

const DEMO_CARD: Flashcard = {
  id: "demo",
  front: "What is EduPilot?",
  back: "EduPilot is an AI-powered study assistant that helps you learn faster with smart flashcards, quizzes, and personalized study plans.",
  mastered: false,
}

// function formatRelativeTime(value: string) {
//   const diff = Date.now() - new Date(value).getTime()
//   const mins = Math.floor(diff / 60000)
//   if (mins < 1) return "Just now"
//   if (mins < 60) return `${mins} min ago`
//   const hours = Math.floor(mins / 60)
//   if (hours < 24) return `${hours} hr ago`
//   const days = Math.floor(hours / 24)
//   return `${days} day${days > 1 ? "s" : ""} ago`
// }

export default function FlashcardsPage() {
  const { subscription, isLoading, error, email } = useUser()

  const [cards, setCards] = useState<Flashcard[]>([DEMO_CARD])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [aiTopic, setAiTopic] = useState("")
  const [aiCount, setAiCount] = useState("10")
  const [isGenerating, setIsGenerating] = useState(false)
  const [genError, setGenError] = useState("")
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [pendingGenerateClick, setPendingGenerateClick] = useState(false)

  const [history, setHistory] = useState<SavedFlashcardSet[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [currentSavedSetId, setCurrentSavedSetId] = useState<string | null>(null)

  const currentCard = cards[currentIndex]
  const masteredCount = useMemo(() => cards.filter((c) => c.mastered).length, [cards])
  const progress = cards.length > 0 ? (masteredCount / cards.length) * 100 : 0
  const isPaidUser = hasPaidAccess(subscription)
  const activePlanName = subscription?.plan_id === "premium" ? "Premium" : subscription?.plan_id === "pro" ? "Pro" : null

  useEffect(() => {
    void loadHistory()
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const setId = new URLSearchParams(window.location.search).get("set")
    if (!setId) return

    const existing = history.find((item) => item.id === setId)
    if (existing) {
      openSavedSet(existing)
      return
    }

    if (!historyLoading) {
      void loadSavedSet(setId)
    }
  }, [history, historyLoading])

  const handleGenerateClick = () => {
    setGenError("")

    if (isLoading) {
      setPendingGenerateClick(true)
      return
    }

    if (error === "not_authenticated" || !email) {
      setShowLoginModal(true)
      return
    }

    if (!isPaidUser) {
      window.location.href = "/pricing?plan=pro&feature=flashcards"
      return
    }

    setDialogOpen(true)
  }

  useEffect(() => {
    if (!pendingGenerateClick || isLoading) return
    setPendingGenerateClick(false)
    handleGenerateClick()
  }, [pendingGenerateClick, isLoading, error, email, isPaidUser])

  async function loadHistory() {
    try {
      setHistoryLoading(true)
      const response = await fetch("/api/ai/flashcards", { cache: "no-store" })
      const data = await response.json().catch(() => ({ sets: [] }))

      if (response.ok) {
        setHistory(data.sets || [])
      }
    } catch {
      //
    } finally {
      setHistoryLoading(false)
    }
  }

  function openSavedSet(set: SavedFlashcardSet) {
    const restoredCards: Flashcard[] = (set.cards || []).map((card, index) => ({
      id: `${set.id}-${index}`,
      front: card.front,
      back: card.back,
      mastered: false,
    }))

    if (!restoredCards.length) return

    setCards(restoredCards)
    setCurrentIndex(0)
    setIsFlipped(false)
    setCurrentSavedSetId(set.id)
    setAiTopic(set.topic)

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.set("set", set.id)
      window.history.replaceState({}, "", url.toString())
    }
  }

  async function loadSavedSet(setId: string) {
    try {
      const response = await fetch(`/api/ai/flashcards/${setId}`, { cache: "no-store" })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.set) return

      const set = data.set as SavedFlashcardSet
      setHistory((prev) => (prev.some((item) => item.id === set.id) ? prev : [set, ...prev]))
      openSavedSet(set)
    } catch {
      //
    }
  }

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1)
      setIsFlipped(false)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
      setIsFlipped(false)
    }
  }

  const handleMastered = () => {
    setCards((prev) => prev.map((c, i) => (i === currentIndex ? { ...c, mastered: true } : c)))
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1)
      setIsFlipped(false)
    }
  }

  const handleShuffle = () => {
    setCards((c) => [...c].sort(() => Math.random() - 0.5))
    setCurrentIndex(0)
    setIsFlipped(false)
  }

  const handleReset = () => {
    setCards((c) => c.map((x) => ({ ...x, mastered: false })))
    setCurrentIndex(0)
    setIsFlipped(false)
  }

  const handleGenerate = async () => {
    if (!aiTopic.trim()) return

    setIsGenerating(true)
    setGenError("")

    try {
      const res = await fetch("/api/ai/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic.trim(), count: parseInt(aiCount, 10) }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.requiresLogin) {
          setShowLoginModal(true)
          setDialogOpen(false)
          return
        }
        if (data.requiresUpgrade) {
          window.location.href = "/pricing?plan=pro&feature=flashcards"
          setDialogOpen(false)
          return
        }
        setGenError(data.error || "Failed to generate flashcards")
        return
      }

      const newCards: Flashcard[] = data.flashcards.map((f: { front: string; back: string }, i: number) => ({
        id: `ai-${Date.now()}-${i}`,
        front: f.front,
        back: f.back,
        mastered: false,
      }))

      setCards(newCards)
      setCurrentIndex(0)
      setIsFlipped(false)
      setDialogOpen(false)

      if (data.savedSet) {
        const savedSet = data.savedSet as SavedFlashcardSet
        setCurrentSavedSetId(savedSet.id)
        setHistory((prev) => [savedSet, ...prev.filter((item) => item.id !== savedSet.id)].slice(0, 12))

        if (typeof window !== "undefined") {
          const url = new URL(window.location.href)
          url.searchParams.set("set", savedSet.id)
          window.history.replaceState({}, "", url.toString())
        }
      } else {
        await loadHistory()
      }
    } catch {
      setGenError("Network error. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Flashcards</h1>
            <p className="text-muted-foreground">Review and memorize with AI-generated cards</p>
          </div>
          <Button className="gap-2" onClick={handleGenerateClick} disabled={isLoading}>
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </Button>
        </div>

        {activePlanName ? (
          <Card className="border-emerald-500/30 bg-emerald-500/10">
            <CardContent className="flex items-start gap-3 p-4 text-sm">
              <Crown className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              <div>
                <p className="font-medium text-foreground">You are on {activePlanName} Plan.</p>
                <p className="mt-1 text-muted-foreground">Your premium features are now active across the app.</p>
              </div>
            </CardContent>
          </Card>
        ) : !isPaidUser ? (
          <Card className="border-amber-500/30 bg-amber-500/10">
            <CardContent className="flex items-start gap-3 p-4 text-sm">
              <Crown className="mt-0.5 h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Flashcards is a Pro feature.</p>
                <p className="text-muted-foreground mt-1">
                  Upgrade on the Pricing page to unlock Flashcards instantly after successful payment.
                </p>
                <div className="mt-3">
                  <Button asChild size="sm" variant="outline">
                    <Link href="/pricing?plan=pro&feature=flashcards">View Pricing</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  Card {currentIndex + 1} of {cards.length}
                </span>
                <span>
                  {masteredCount} mastered · {Math.round(progress)}%
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="relative h-64 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
              <div
                className={cn(
                  "absolute inset-0 transition-all duration-500 [transform-style:preserve-3d]",
                  isFlipped && "[transform:rotateY(180deg)]"
                )}
              >
                <Card
                  className={cn(
                    "absolute inset-0 border-border bg-card [backface-visibility:hidden]",
                    currentCard?.mastered && "border-emerald-500/30 bg-emerald-500/5"
                  )}
                >
                  <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Question</p>
                    <p className="text-xl font-semibold text-foreground">{currentCard?.front}</p>
                    <p className="text-sm text-muted-foreground mt-6">Click to reveal answer</p>
                  </CardContent>
                </Card>

                <Card className="absolute inset-0 border-primary/30 bg-primary/5 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Answer</p>
                    <p className="text-lg text-foreground">{currentCard?.back}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button variant="outline" size="icon" onClick={handlePrev} disabled={currentIndex === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex gap-2 flex-1 justify-center flex-wrap">
                {isFlipped && !currentCard?.mastered && (
                  <Button size="sm" className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleMastered}>
                    <Check className="h-4 w-4" />
                    Got it!
                  </Button>
                )}
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShuffle}>
                  <Shuffle className="h-4 w-4" />
                  Shuffle
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>

              <Button variant="outline" size="icon" onClick={handleNext} disabled={currentIndex === cards.length - 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {masteredCount === cards.length && cards.length > 1 && (
              <Card className="border-emerald-500/30 bg-emerald-500/10">
                <CardContent className="p-4 text-center">
                  <p className="font-semibold text-emerald-500">🎉 You&apos;ve mastered all cards!</p>
                  <p className="text-sm text-muted-foreground mt-1">Generate a new set or shuffle to review again.</p>
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="border-border bg-card h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5 text-primary" />
                Flashcards History
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {historyLoading ? (
                <div className="text-sm text-muted-foreground">Loading history...</div>
              ) : history.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
                  <Layers className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="font-medium text-foreground">No flashcards history yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generate a flashcard topic and it will appear here.
                  </p>
                </div>
              ) : (
                history.map((item) => {
                  const isActive = currentSavedSetId === item.id

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openSavedSet(item)}
                      className={cn(
                        "w-full rounded-xl border text-left transition-all p-3",
                        isActive
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background/40 hover:border-primary/40 hover:bg-primary/5"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card">
                              <Layers className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{item.topic}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="secondary" className="text-[11px]">
                                  {item.card_count} cards
                                </Badge>
                                {isActive && (
                                  <Badge variant="default" className="text-[11px] bg-emerald-500 hover:bg-emerald-600 text-white border-none">
                                    {masteredCount}/{cards.length} mastered ({Math.round(progress)}%)
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 text-muted-foreground">
                          <Eye className="h-4 w-4" />
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate AI Flashcards
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Topic or description</Label>
              <Input
                placeholder="e.g. Photosynthesis, JavaScript Arrays, World War II..."
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                className="bg-secondary border-border"
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>

            <div className="space-y-2">
              <Label>Number of flashcards</Label>
              <Select value={aiCount} onValueChange={setAiCount}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} cards
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {genError && <p className="text-sm text-destructive">{genError}</p>}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1 gap-2" onClick={handleGenerate} disabled={!aiTopic.trim() || isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LoginGateModal open={showLoginModal} onOpenChange={setShowLoginModal} featureName="Flashcards" />
    </>
  )
}