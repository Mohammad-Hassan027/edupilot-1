"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  FileText,
  MessageSquare,
  Clock,
  Download,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LoginGateModal } from "@/components/login-gate-modal"
import { hasPaidAccess } from "@/lib/plans"
import { useUser } from "@/hooks/use-user"

type ReviewRating = "again" | "hard" | "good" | "easy"

interface Flashcard {
  id: string
  cardIndex: number
  front: string
  back: string
  mastered: boolean
  interval: number
  easeFactor: number
  repetitions: number
  nextReviewAt: string
}

interface SavedFlashcardCard {
  front: string
  back: string
  interval?: number
  easeFactor?: number
  repetitions?: number
  nextReviewAt?: string
}

interface SavedFlashcardSet {
  id: string
  topic: string
  card_count: number
  cards: SavedFlashcardCard[]
  source_type?: "topic" | "note" | "chat"
  source_id?: string | null
  created_at: string
}

interface DueFlashcard {
  setId: string
  topic: string
  cardIndex: number
  front: string
  back: string
  interval: number
  easeFactor: number
  repetitions: number
  nextReviewAt: string
  lastReviewedAt: string | null
}

function isDue(nextReviewAt?: string) {
  if (!nextReviewAt) return true
  return new Date(nextReviewAt).getTime() <= Date.now()
}

function countDue(set: SavedFlashcardSet) {
  return set.cards.filter((card) => isDue(card.nextReviewAt)).length
}

const DEMO_CARD: Flashcard = {
  id: "demo",
  cardIndex: 0,
  front: "What is EduPilot?",
  back: "EduPilot is an AI-powered study assistant that helps you learn faster with smart flashcards, quizzes, and personalized study plans.",
  mastered: false,
  interval: 0,
  easeFactor: 2.5,
  repetitions: 0,
  nextReviewAt: new Date().toISOString(),
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
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  const [dueCards, setDueCards] = useState<DueFlashcard[]>([])
  const [dueLoading, setDueLoading] = useState(true)

  const currentCard = cards[currentIndex]
  const masteredCount = useMemo(() => cards.filter((c) => c.mastered).length, [cards])
  const progress = cards.length > 0 ? (masteredCount / cards.length) * 100 : 0
  const isPaidUser = hasPaidAccess(subscription)
  const activePlanName = subscription?.plan_id === "premium" ? "Premium" : subscription?.plan_id === "pro" ? "Pro" : null

  const dueSetGroups = useMemo(() => {
    const groups = new Map<string, { setId: string; topic: string; count: number }>()
    for (const card of dueCards) {
      const existing = groups.get(card.setId)
      if (existing) existing.count += 1
      else groups.set(card.setId, { setId: card.setId, topic: card.topic, count: 1 })
    }
    return Array.from(groups.values())
  }, [dueCards])

  useEffect(() => {
    void loadHistory()
    void loadDueCards()
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

  async function loadDueCards() {
    try {
      setDueLoading(true)
      const response = await fetch("/api/ai/flashcards/due", { cache: "no-store" })
      const data = await response.json().catch(() => ({ cards: [] }))

      if (response.ok) {
        setDueCards(data.cards || [])
      }
    } catch {
      //
    } finally {
      setDueLoading(false)
    }
  }

  async function startDueReview(setId: string) {
    let set = history.find((item) => item.id === setId)

    if (!set) {
      try {
        const response = await fetch(`/api/ai/flashcards/${setId}`, { cache: "no-store" })
        const data = await response.json().catch(() => ({}))
        if (response.ok && data.set) {
          set = data.set as SavedFlashcardSet
          setHistory((prev) => (prev.some((item) => item.id === set!.id) ? prev : [set!, ...prev]))
        }
      } catch {
        //
      }
    }

    if (!set) return

    const dueOnly: Flashcard[] = set.cards
      .map((card, index) => ({
        id: `${set!.id}-${index}`,
        cardIndex: index,
        front: card.front,
        back: card.back,
        mastered: (card.repetitions ?? 0) > 0,
        interval: card.interval ?? 0,
        easeFactor: card.easeFactor ?? 2.5,
        repetitions: card.repetitions ?? 0,
        nextReviewAt: card.nextReviewAt ?? new Date().toISOString(),
      }))
      .filter((card) => isDue(card.nextReviewAt))

    if (!dueOnly.length) return

    setCards(dueOnly)
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

  function openSavedSet(set: SavedFlashcardSet) {
    const restoredCards: Flashcard[] = (set.cards || []).map((card, index) => ({
      id: `${set.id}-${index}`,
      cardIndex: index,
      front: card.front,
      back: card.back,
      mastered: (card.repetitions ?? 0) > 0,
      interval: card.interval ?? 0,
      easeFactor: card.easeFactor ?? 2.5,
      repetitions: card.repetitions ?? 0,
      nextReviewAt: card.nextReviewAt ?? new Date().toISOString(),
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

  function openSavedSetShuffled(set: SavedFlashcardSet) {
    openSavedSet(set)
    setCards((c) => [...c].sort(() => Math.random() - 0.5))
    setCurrentIndex(0)
    setIsFlipped(false)
  }

  function openSavedSetReset(set: SavedFlashcardSet) {
    openSavedSet(set)
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

  const handleReview = async (rating: ReviewRating) => {
    const card = cards[currentIndex]
    if (!card) return

    const advance = () => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex((i) => i + 1)
        setIsFlipped(false)
      }
    }

    if (!currentSavedSetId || card.id === "demo") {
      setCards((prev) =>
        prev.map((c, i) => (i === currentIndex ? { ...c, mastered: rating !== "again" } : c))
      )
      advance()
      return
    }

    try {
      setReviewSubmitting(true)

      const response = await fetch(`/api/ai/flashcards/${currentSavedSetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardIndex: card.cardIndex, rating }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok && data.set) {
        const updatedSet = data.set as SavedFlashcardSet
        const updatedCard = updatedSet.cards[card.cardIndex]

        setCards((prev) =>
          prev.map((c, i) =>
            i === currentIndex
              ? {
                  ...c,
                  mastered: (updatedCard.repetitions ?? 0) > 0,
                  interval: updatedCard.interval ?? c.interval,
                  easeFactor: updatedCard.easeFactor ?? c.easeFactor,
                  repetitions: updatedCard.repetitions ?? c.repetitions,
                  nextReviewAt: updatedCard.nextReviewAt ?? c.nextReviewAt,
                }
              : c
          )
        )

        setHistory((prev) => prev.map((item) => (item.id === updatedSet.id ? updatedSet : item)))
        void loadDueCards()
      }
    } catch {
      //
    } finally {
      setReviewSubmitting(false)
      advance()
    }
  }

  const handleShuffle = () => {
    setCards((c) => [...c].sort(() => Math.random() - 0.5))
    setCurrentIndex(0)
    setIsFlipped(false)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't fire when a dialog is open or focus is inside an input/textarea
      if (dialogOpen) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

      switch (e.key) {
        case " ":
        case "Enter":
          e.preventDefault()
          setIsFlipped((prev) => !prev)
          break
        case "ArrowRight":
        case "l":
        case "L":
          e.preventDefault()
          handleNext()
          break
        case "ArrowLeft":
        case "j":
        case "J":
          e.preventDefault()
          handlePrev()
          break
        case "m":
        case "M":
          if (isFlipped && currentCard && !reviewSubmitting) {
            void handleReview("good")
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [dialogOpen, isFlipped, currentCard, reviewSubmitting, handleNext, handlePrev, handleReview])

  const handleReset = () => {
    setCards((c) => c.map((x) => ({ ...x, mastered: false })))
    setCurrentIndex(0)
    setIsFlipped(false)
  }

  const canExport = cards.length >= 1 && cards[0].id !== "demo"

  function exportFilename(extension: string) {
    const cleanTopic = aiTopic ? aiTopic.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") : "set"
    return `edupilot-flashcards-${cleanTopic}-${Date.now()}.${extension}`
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    if (!canExport) return

    const headers = `"Front","Back"\n`
    const csvContent = cards
      .map(
        (c) =>
          `"${c.front.replace(/"/g, '""')}"` +
          "," +
          `"${c.back.replace(/"/g, '""')}"`
      )
      .join("\n")
    const csvData = headers + csvContent

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" })
    downloadBlob(blob, exportFilename("csv"))
  }

  const handleExportPDF = async () => {
    if (!canExport || isExportingPdf) return

    setIsExportingPdf(true)

    try {
      const html2pdf = (await import("html2pdf.js")).default

      const container = document.createElement("div")
      container.style.fontFamily = "Arial, Helvetica, sans-serif"
      container.style.padding = "24px"
      container.style.color = "#111111"
      container.style.background = "#ffffff"

      const title = document.createElement("h1")
      title.textContent = aiTopic ? `Flashcards: ${aiTopic}` : "Flashcards"
      title.style.fontSize = "20px"
      title.style.marginBottom = "4px"
      container.appendChild(title)

      const subtitle = document.createElement("p")
      subtitle.textContent = `${cards.length} card${cards.length === 1 ? "" : "s"} · Generated by EduPilot`
      subtitle.style.fontSize = "11px"
      subtitle.style.color = "#666666"
      subtitle.style.marginBottom = "16px"
      container.appendChild(subtitle)

      cards.forEach((card, index) => {
        const cardEl = document.createElement("div")
        cardEl.style.border = "1px solid #d0d0d0"
        cardEl.style.borderRadius = "8px"
        cardEl.style.padding = "12px 16px"
        cardEl.style.marginBottom = "10px"
        cardEl.style.pageBreakInside = "avoid"
        cardEl.style.breakInside = "avoid"

        const label = document.createElement("div")
        label.textContent = `Card ${index + 1}`
        label.style.fontSize = "10px"
        label.style.color = "#888888"
        label.style.marginBottom = "6px"
        cardEl.appendChild(label)

        const front = document.createElement("div")
        front.textContent = card.front
        front.style.fontSize = "13px"
        front.style.fontWeight = "600"
        front.style.marginBottom = "6px"
        front.style.whiteSpace = "pre-wrap"
        cardEl.appendChild(front)

        const divider = document.createElement("div")
        divider.style.borderTop = "1px dashed #cccccc"
        divider.style.margin = "6px 0"
        cardEl.appendChild(divider)

        const back = document.createElement("div")
        back.textContent = card.back
        back.style.fontSize = "12px"
        back.style.color = "#333333"
        back.style.whiteSpace = "pre-wrap"
        cardEl.appendChild(back)

        container.appendChild(cardEl)
      })

      await html2pdf()
        .set({
          margin: 10,
          filename: exportFilename("pdf"),
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          // `pagebreak` isn't in the shipped type defs but is a supported html2pdf.js option.
          ...({ pagebreak: { mode: ["css", "legacy"] } } as object),
        })
        .from(container)
        .save()
    } catch (err) {
      console.error("Failed to export flashcards as PDF", err)
    } finally {
      setIsExportingPdf(false)
    }
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

      setDialogOpen(false)

      if (data.savedSet) {
        const savedSet = data.savedSet as SavedFlashcardSet
        setHistory((prev) => [savedSet, ...prev.filter((item) => item.id !== savedSet.id)].slice(0, 12))
        openSavedSet(savedSet)
      } else {
        const newCards: Flashcard[] = data.flashcards.map((f: { front: string; back: string }, i: number) => ({
          id: `ai-${Date.now()}-${i}`,
          cardIndex: i,
          front: f.front,
          back: f.back,
          mastered: false,
          interval: 0,
          easeFactor: 2.5,
          repetitions: 0,
          nextReviewAt: new Date().toISOString(),
        }))
        setCards(newCards)
        setCurrentIndex(0)
        setIsFlipped(false)
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

            {isFlipped ? (
              <div className="space-y-2">
                <p className="text-center text-xs text-muted-foreground">How well did you know this?</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                    disabled={reviewSubmitting}
                    onClick={() => void handleReview("again")}
                  >
                    Again
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
                    disabled={reviewSubmitting}
                    onClick={() => void handleReview("hard")}
                  >
                    Hard
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white"
                    disabled={reviewSubmitting}
                    onClick={() => void handleReview("good")}
                  >
                    <Check className="h-4 w-4" />
                    Good
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                    disabled={reviewSubmitting}
                    onClick={() => void handleReview("easy")}
                  >
                    Easy
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <Button variant="outline" size="icon" onClick={handlePrev} disabled={currentIndex === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex gap-2 flex-1 justify-center flex-wrap">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShuffle}>
                  <Shuffle className="h-4 w-4" />
                  Shuffle
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                {canExport && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5" disabled={isExportingPdf}>
                        {isExportingPdf ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center">
                      <DropdownMenuItem onClick={() => void handleExportPDF()} disabled={isExportingPdf}>
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportCSV}>
                        Export as CSV (Anki)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <Button variant="outline" size="icon" onClick={handleNext} disabled={currentIndex === cards.length - 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground/70 select-none">
              <span><kbd className="rounded border border-border/60 bg-secondary px-1.5 py-0.5 font-mono text-[10px]">Space</kbd> Flip</span>
              <span><kbd className="rounded border border-border/60 bg-secondary px-1.5 py-0.5 font-mono text-[10px]">←</kbd> Prev</span>
              <span><kbd className="rounded border border-border/60 bg-secondary px-1.5 py-0.5 font-mono text-[10px]">→</kbd> Next</span>
              <span><kbd className="rounded border border-border/60 bg-secondary px-1.5 py-0.5 font-mono text-[10px]">M</kbd> Good</span>
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

          <div className="space-y-6">
          <Card className="border-border bg-card h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-amber-500" />
                Due for Review
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {dueLoading ? (
                <div className="text-sm text-muted-foreground">Loading due cards...</div>
              ) : dueCards.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
                  <Check className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">All caught up — no cards due right now.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {dueCards.length} card{dueCards.length === 1 ? "" : "s"} due across {dueSetGroups.length} deck
                    {dueSetGroups.length === 1 ? "" : "s"}
                  </p>
                  {dueSetGroups.map((group) => (
                    <button
                      key={group.setId}
                      type="button"
                      onClick={() => void startDueReview(group.setId)}
                      className="w-full rounded-xl border border-border bg-background/40 hover:border-amber-500/40 hover:bg-amber-500/5 text-left p-3 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-foreground truncate">{group.topic}</p>
                        <Badge variant="outline" className="text-[11px] border-amber-500/40 text-amber-500 shrink-0">
                          {group.count} due
                        </Badge>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

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
                                {item.source_type === "note" ? (
                                  <Badge variant="outline" className="gap-1 text-[11px]">
                                    <FileText className="h-3 w-3" />
                                    From Note
                                  </Badge>
                                ) : item.source_type === "chat" ? (
                                  <Badge variant="outline" className="gap-1 text-[11px]">
                                    <MessageSquare className="h-3 w-3" />
                                    From Chat
                                  </Badge>
                                ) : null}
                                {countDue(item) > 0 && (
                                  <Badge variant="outline" className="gap-1 text-[11px] border-amber-500/40 text-amber-500">
                                    <Clock className="h-3 w-3" />
                                    {countDue(item)} due
                                  </Badge>
                                )}
                                {isActive && (
                                  <Badge variant="default" className="text-[11px] bg-emerald-500 hover:bg-emerald-600 text-white border-none">
                                    {masteredCount}/{cards.length} mastered ({Math.round(progress)}%)
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1">
                          <button
                            type="button"
                            title="Open set"
                            onClick={(e) => { e.stopPropagation(); openSavedSet(item) }}
                            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Open shuffled"
                            onClick={(e) => { e.stopPropagation(); openSavedSetShuffled(item) }}
                            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
                          >
                            <Shuffle className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Open with mastery reset"
                            onClick={(e) => { e.stopPropagation(); openSavedSetReset(item) }}
                            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-destructive transition-colors"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
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