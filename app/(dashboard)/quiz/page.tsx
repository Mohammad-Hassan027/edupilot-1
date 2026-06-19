"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Crown, Brain, History, Trash2, CheckCircle2, XCircle, Trophy, Eye } from "lucide-react"
import { useUser } from "@/hooks/use-user"
import { canAccessFeature } from "@/lib/plans"
import { LoginGateModal } from "@/components/login-gate-modal"
import { cn } from "@/lib/utils"
import { Kbd } from "@/components/ui/kbd"

type QuizOption = {
  id: string
  text: string
}

type QuizQuestion = {
  id: string
  question: string
  options: QuizOption[]
  correctOptionId: string
  explanation?: string | null
}

type QuizAnswer = {
  questionId: string
  selectedOptionId: string | null
  isCorrect?: boolean
}

type QuizAttempt = {
  id: string
  topic: string
  total_questions: number
  score: number
  percentage: number
  questions: QuizQuestion[]
  answers: QuizAnswer[]
  created_at: string
}

export default function QuizPage() {
  const { subscription, isLoading, error, email } = useUser()
  const [showLoginModal, setShowLoginModal] = useState(false)

  const [topic, setTopic] = useState("")
  const [count, setCount] = useState("5")
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Timer config (set before generating)
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(60)

  // Active timer state (resets per active question)
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  const [quizTopic, setQuizTopic] = useState("")
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [submittedAttempt, setSubmittedAttempt] = useState<QuizAttempt | null>(null)

  const [history, setHistory] = useState<QuizAttempt[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null)
  const [pageError, setPageError] = useState("")

  const canUseQuiz = canAccessFeature(subscription, "quiz")
  const activePlanName =
    subscription?.plan_id === "premium" ? "Premium" : subscription?.plan_id === "pro" ? "Pro" : null

  useEffect(() => {
    void loadHistory()
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const attemptId = new URLSearchParams(window.location.search).get("attempt")
    if (!attemptId) return

    const existing = history.find((item) => item.id === attemptId)
    if (existing) {
      openAttempt(existing)
      return
    }

    if (!historyLoading) {
      void loadAttempt(attemptId)
    }
  }, [history, historyLoading])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (questions.length > 0 && !submittedAttempt && !submitting) {
          e.preventDefault()
          void handleSubmitQuiz()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [questions.length, submittedAttempt, submitting, handleSubmitQuiz])

  // Per-question countdown timer
  useEffect(() => {
    if (!timerEnabled || submittedAttempt || questions.length === 0) return

    const currentQuestion = questions[activeQuestionIndex]
    if (!currentQuestion) return

    // Reset the countdown whenever the active question changes
    setTimeRemaining(secondsPerQuestion)

    const interval = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          // Time's up — advance to the next unanswered question
          clearInterval(interval)
          setActiveQuestionIndex((idx) => {
            const next = idx + 1
            if (next < questions.length) {
              // Smooth-scroll to the next question card
              setTimeout(() => {
                document.getElementById(`question-${next}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
              }, 50)
              return next
            }
            // All questions exhausted — auto-submit
            void handleSubmitQuiz()
            return idx
          })
          return null
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timerEnabled, activeQuestionIndex, questions.length, submittedAttempt])

  const scorePreview = useMemo(() => {
    if (!submittedAttempt) return null
    return `${submittedAttempt.score}/${submittedAttempt.total_questions}`
  }, [submittedAttempt])

  async function loadHistory() {
    try {
      setHistoryLoading(true)
      const response = await fetch("/api/ai/quiz", { cache: "no-store" })
      const data = await response.json().catch(() => ({ attempts: [] }))
      if (response.ok) {
        setHistory(data.attempts || [])
      }
    } finally {
      setHistoryLoading(false)
    }
  }

  async function loadAttempt(attemptId: string) {
    try {
      const response = await fetch(`/api/ai/quiz/${attemptId}`, { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.attempt) return

      const attempt = data.attempt as QuizAttempt
      setHistory((prev) => (prev.some((item) => item.id === attempt.id) ? prev : [attempt, ...prev]))
      openAttempt(attempt)
    } catch {
      //
    }
  }

  function openAttempt(attempt: QuizAttempt) {
    setSubmittedAttempt(attempt)
    setQuizTopic(attempt.topic)
    setQuestions(attempt.questions)
    setCurrentAttemptId(attempt.id)

    const mapped: Record<string, string> = {}
    for (const answer of attempt.answers || []) {
      if (answer.selectedOptionId) {
        mapped[answer.questionId] = answer.selectedOptionId
      }
    }
    setSelectedAnswers(mapped)

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.set("attempt", attempt.id)
      window.history.replaceState({}, "", url.toString())
    }
  }

  async function handleGenerateQuiz() {
    setPageError("")

    if (isLoading) return
    if (error === "not_authenticated" || !email) {
      setShowLoginModal(true)
      return
    }
    if (!canUseQuiz) {
      window.location.href = "/pricing?plan=premium&feature=quiz"
      return
    }
    if (!topic.trim()) return

    try {
      setGenerating(true)
      setSubmittedAttempt(null)
      setCurrentAttemptId(null)

      const response = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), count: Number(count) }),
      })

      const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          if (data.requiresLogin) {
            setShowLoginModal(true)
            return
          }
          if (data.requiresUpgrade) {
            window.location.href = "/pricing?plan=premium&feature=quiz"
            return
          }
          throw new Error(data.error || "Failed to generate quiz")
        }

        setQuizTopic(data.quiz?.topic || topic.trim())
        setQuestions(data.quiz?.questions || [])
        setSelectedAnswers({})
        setSubmittedAttempt(null)
        setActiveQuestionIndex(0)
        setTimeRemaining(timerEnabled ? secondsPerQuestion : null)

      if (typeof window !== "undefined") {
        const url = new URL(window.location.href)
        url.searchParams.delete("attempt")
        window.history.replaceState({}, "", url.toString())
      }
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to generate quiz")
    } finally {
      setGenerating(false)
    }
  }

  function handleSelect(questionId: string, optionId: string) {
    if (submittedAttempt) return
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }))

    // When timer is enabled, advance to next question after selection
    if (timerEnabled) {
      const idx = questions.findIndex((q) => q.id === questionId)
      const next = idx + 1
      if (next < questions.length) {
        setActiveQuestionIndex(next)
        setTimeout(() => {
          document.getElementById(`question-${next}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
        }, 50)
      }
    }
  }

  async function handleSubmitQuiz() {
    if (!questions.length) return

    try {
      setSubmitting(true)
      const answers = questions.map((question) => ({
        questionId: question.id,
        selectedOptionId: selectedAnswers[question.id] || null,
      }))

      const response = await fetch("/api/ai/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: quizTopic,
          questions,
          answers,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit quiz")
      }

      const savedAttempt = data.result.savedAttempt as QuizAttempt
      setSubmittedAttempt(savedAttempt)
      setCurrentAttemptId(savedAttempt.id)
      setTimeRemaining(null)
      setHistory((prev) => [savedAttempt, ...prev.filter((item) => item.id !== savedAttempt.id)].slice(0, 12))

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("quiz-score-updated"))
      }

      if (typeof window !== "undefined") {
        const url = new URL(window.location.href)
        url.searchParams.set("attempt", savedAttempt.id)
        window.history.replaceState({}, "", url.toString())
      }
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to submit quiz")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteHistory(attemptId: string) {
    try {
      const response = await fetch(`/api/ai/quiz/${attemptId}`, {
        method: "DELETE",
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete quiz history")
      }

      setHistory((prev) => prev.filter((item) => item.id !== attemptId))

      if (currentAttemptId === attemptId) {
        setCurrentAttemptId(null)
        setSubmittedAttempt(null)
        setQuestions([])
        setSelectedAnswers({})
        setQuizTopic("")
      }
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to delete quiz history")
    }
  }

  function getAnswerResult(questionId: string) {
    return submittedAttempt?.answers?.find((answer) => answer.questionId === questionId) || null
  }

  return (
    <>
      <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Quiz Generator</h1>
          <p className="text-muted-foreground">Generate AI quizzes, check answers, and track your improvement</p>
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
        ) : (
          <Card className="border-amber-500/30 bg-amber-500/10">
            <CardContent className="flex items-start gap-3 p-4 text-sm">
              <Crown className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="font-medium text-foreground">Quiz is a Premium feature.</p>
                <p className="text-muted-foreground mt-1">
                  Upgrade on the Pricing page to unlock Quiz instantly after successful payment.
                </p>
                <div className="mt-3">
                  <Button asChild size="sm" variant="outline">
                    <Link href="/pricing?plan=premium&feature=quiz">View Pricing</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardContent className="p-6 space-y-5">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Brain className="h-8 w-8 text-primary" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Quiz Topic</Label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Calculus, Machine Learning, World History..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Number of Questions</Label>
                  <Select value={count} onValueChange={setCount}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["5", "7", "10"].map((value) => (
                        <SelectItem key={value} value={value}>
                          {value} Questions
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Timer per question</Label>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={timerEnabled}
                      onClick={() => setTimerEnabled((v) => !v)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        timerEnabled ? "bg-primary" : "bg-secondary"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                          timerEnabled ? "translate-x-5" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                  {timerEnabled && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Seconds per question</Label>
                      <Select
                        value={String(secondsPerQuestion)}
                        onValueChange={(v) => setSecondsPerQuestion(Number(v))}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[30, 60, 90, 120].map((s) => (
                            <SelectItem key={s} value={String(s)}>
                              {s}s
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {pageError ? <p className="text-sm text-destructive">{pageError}</p> : null}

                <Button
                  className="w-full"
                  onClick={handleGenerateQuiz}
                  disabled={!topic.trim() || generating}
                >
                  {generating ? "Generating Quiz..." : "Generate Quiz"}
                </Button>
              </CardContent>
            </Card>

            {submittedAttempt ? (
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    Quiz Result
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-border bg-secondary/30 p-4">
                      <p className="text-sm text-muted-foreground">Score</p>
                      <p className="text-2xl font-bold text-foreground">{scorePreview}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-secondary/30 p-4">
                      <p className="text-sm text-muted-foreground">Percentage</p>
                      <p className="text-2xl font-bold text-foreground">{submittedAttempt.percentage}%</p>
                    </div>
                    <div className="rounded-xl border border-border bg-secondary/30 p-4">
                      <p className="text-sm text-muted-foreground">Topic</p>
                      <p className="text-lg font-semibold text-foreground truncate">{submittedAttempt.topic}</p>
                    </div>
                  </div>
                  <Progress value={submittedAttempt.percentage} />
                </CardContent>
              </Card>
            ) : null}

            {questions.length > 0 ? (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle>{quizTopic || "Quiz"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {questions.map((question, index) => {
                    const answerResult = getAnswerResult(question.id)
                    const isActiveTimerQuestion = timerEnabled && !submittedAttempt && index === activeQuestionIndex
                    const timerPercent =
                      isActiveTimerQuestion && timeRemaining !== null
                        ? (timeRemaining / secondsPerQuestion) * 100
                        : 100
                    const isTimerCritical = isActiveTimerQuestion && timeRemaining !== null && timeRemaining < 10

                    return (
                      <div key={question.id} id={`question-${index}`} className="rounded-xl border border-border p-4 space-y-4">
                        {isActiveTimerQuestion && timeRemaining !== null && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Time remaining</span>
                              <span className={cn(isTimerCritical && "text-destructive font-semibold")}>
                                {timeRemaining}s
                              </span>
                            </div>
                            <Progress
                              value={timerPercent}
                              className={cn(
                                "h-1.5 transition-colors",
                                isTimerCritical && "[&>div]:bg-destructive"
                              )}
                            />
                          </div>
                        )}

                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Question {index + 1}</p>
                          <p className="font-medium text-foreground">{question.question}</p>
                        </div>

                        <div className="space-y-2">
                          {question.options.map((option) => {
                            const isSelected = selectedAnswers[question.id] === option.id
                            const isCorrect = question.correctOptionId === option.id
                            const showResults = Boolean(submittedAttempt)

                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => handleSelect(question.id, option.id)}
                                className={cn(
                                  "w-full rounded-lg border px-4 py-3 text-left transition",
                                  isSelected && !showResults && "border-primary bg-primary/10",
                                  showResults && isCorrect && "border-emerald-500 bg-emerald-500/10",
                                  showResults && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                                  !isSelected && !showResults && "border-border hover:border-primary/40"
                                )}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-sm text-foreground">{option.text}</span>
                                  {submittedAttempt && isCorrect ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                  ) : null}
                                  {submittedAttempt && isSelected && !isCorrect ? (
                                    <XCircle className="h-4 w-4 text-destructive" />
                                  ) : null}
                                </div>
                              </button>
                            )
                          })}
                        </div>

                        {submittedAttempt ? (
                          <div className="rounded-lg bg-secondary/30 p-3 text-sm">
                            <p className="font-medium text-foreground mb-1">
                              {answerResult?.isCorrect ? "Correct Answer" : "Review"}
                            </p>
                            <p className="text-muted-foreground">
                              {question.explanation || "Review this concept and try again to improve your score."}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}

                  {!submittedAttempt ? (
                    <div className="flex items-center gap-2">
                      <Button onClick={handleSubmitQuiz} disabled={submitting}>
                        {submitting ? "Checking Answers..." : "Submit Quiz"}
                      </Button>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Kbd>Ctrl</Kbd>
                        <Kbd>↵</Kbd>
                      </span>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>

          <Card className="border-border bg-card h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5 text-primary" />
                Quiz History
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {historyLoading ? (
                <div className="text-sm text-muted-foreground">Loading quiz history...</div>
              ) : history.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
                  <Brain className="h-8 w-8 text-primary mx-auto mb-3" />
                  <p className="font-medium text-foreground">No quiz history yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete a quiz and it will appear here.
                  </p>
                </div>
              ) : (
                history.map((item) => {
                  const isActive = currentAttemptId === item.id

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-xl border transition-all p-3",
                        isActive
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background/40 hover:border-primary/40 hover:bg-primary/5"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => openAttempt(item)}
                          className="flex flex-1 min-w-0 items-start gap-3 text-left"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card">
                            <Brain className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground truncate">{item.topic}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge variant="secondary" className="text-[11px]">
                                {item.score}/{item.total_questions}
                              </Badge>
                              <Badge variant="secondary" className="text-[11px]">
                                {item.percentage}%
                              </Badge>
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openAttempt(item)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteHistory(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <LoginGateModal open={showLoginModal} onOpenChange={setShowLoginModal} featureName="Quiz" />
    </>
  )
}