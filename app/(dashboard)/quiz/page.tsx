"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Brain, Sparkles, Check, X, RefreshCw, Trophy, AlertTriangle, ChevronRight, BookOpen, ArrowRight, Loader2, Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import { LoginGateModal } from "@/components/login-gate-modal"
import { useUser } from "@/hooks/use-user"
import { canAccessFeature } from "@/lib/plans"

interface Question {
  question: string
  options: string[]
  answer: string
  explanation: string
}

type QuizState = "setup" | "active" | "results"

export default function QuizPage() {
  const { subscription, refetch, isLoading, error: userError, email } = useUser()
  const [quizState, setQuizState] = useState<QuizState>("setup")
  const [topic, setTopic] = useState("")
  const [questionCount, setQuestionCount] = useState("5")
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [answers, setAnswers] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState("")
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [pendingGenerateClick, setPendingGenerateClick] = useState(false)

  const canUseQuiz = canAccessFeature(subscription, "quiz")
  // const activePlanName = subscription?.plan_id === "premium" ? "Premium" : subscription?.plan_id === "pro" ? "Pro" : null
  const activePlanName = subscription?.plan_id === "premium" ? "Premium" : null  
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0
  const correctCount = answers.filter((a, i) => a === questions[i]?.answer).length
  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0

  const handleGenerateQuiz = async () => {
    if (!topic.trim()) return
    if (isLoading) {
      setPendingGenerateClick(true)
      return
    }

    if (userError === "not_authenticated" || !email) {
      setShowLoginModal(true)
      return
    }

    if (!canUseQuiz) {
      window.location.href = "/pricing?plan=premium&feature=quiz"
      return
    }

    setIsGenerating(true)
    setError("")
    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), count: parseInt(questionCount, 10) }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.code === "UNAUTHORIZED" || data.requiresLogin) { setShowLoginModal(true); return }
        if (data.code === "NO_CREDITS" || data.requiresUpgrade) { window.location.href = "/pricing?plan=premium&feature=quiz"; return }
        setError(data.error || "Failed to generate quiz. Please try again.")
        return
      }

      setQuestions(data.questions)
      setCurrentIndex(0)
      setSelectedAnswer(null)
      setIsAnswered(false)
      setAnswers([])
      setQuizState("active")
    } catch {
      setError("Network error. Please check your connection.")
    } finally {
      setIsGenerating(false)
    }
  }


  useEffect(() => {
    if (!pendingGenerateClick || isLoading || !topic.trim()) return
    setPendingGenerateClick(false)
    void handleGenerateQuiz()
  }, [pendingGenerateClick, isLoading, topic, userError, email, canUseQuiz])

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return
    setAnswers((prev) => [...prev, selectedAnswer])
    setIsAnswered(true)
  }

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
    } else {
      setQuizState("results")
      saveQuizScore()
    }
  }

  const saveQuizScore = async () => {
    try {
      await fetch("/api/usage/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature: "quiz", action: "quiz_completed", metadata: { topic, score, total: questions.length, count: questions.length } }),
      })
    } catch {}
  }

  const handleRetry = () => {
    setQuizState("setup")
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setIsAnswered(false)
    setAnswers([])
    setTopic("")
    setError("")
  }

  const handleRetakeQuiz = () => {
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setIsAnswered(false)
    setAnswers([])
    setQuizState("active")
  }

  if (quizState === "setup") {
    return (
      <>
        <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-foreground">Quiz Generator</h1>
            <p className="text-muted-foreground">Enter a topic and let AI create a personalized quiz for you</p>
          </div>

          {subscription?.plan_id === "premium" ? (
            <Card className="border-emerald-500/30 bg-emerald-500/10">
              <CardContent className="flex items-start gap-3 p-4 text-sm">
                <Crown className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <div>
                  <p className="font-medium text-foreground">You are on {activePlanName} Plan.</p>
                  <p className="mt-1 text-muted-foreground">Your premium features are now active across the app.</p>
                </div>
              </CardContent>
            </Card>
          ) : !canUseQuiz ? (
            <Card className="border-amber-500/30 bg-amber-500/10">
              <CardContent className="flex items-start gap-3 p-4 text-sm">
                <Crown className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <p className="font-medium text-foreground">Quiz is a Premium feature.</p>
                  <p className="mt-1 text-muted-foreground">Upgrade on the Pricing page to unlock Quiz instantly after successful payment.</p>
                <div className="mt-3">
                  <Button asChild size="sm" variant="outline">
                    <Link href="/pricing?plan=premium&feature=quiz">View Pricing</Link>
                  </Button>
                </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-border bg-card">
            <CardContent className="space-y-6 p-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Brain className="h-8 w-8 text-primary" />
              </div>

              {error && <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

              <div className="space-y-3">
                <Label htmlFor="topic">Quiz Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Calculus, Machine Learning, World History..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isGenerating && handleGenerateQuiz()}
                  className="border-border bg-secondary"
                />
              </div>

              <div className="space-y-3">
                <Label>Number of Questions</Label>
                <Select value={questionCount} onValueChange={setQuestionCount}>
                  <SelectTrigger className="border-border bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 15, 20].map((num) => (
                      <SelectItem key={num} value={num.toString()}>{num} Questions</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full gap-2" size="lg" onClick={handleGenerateQuiz} disabled={!topic.trim() || isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Quiz with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Quiz
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <LoginGateModal open={showLoginModal} onOpenChange={setShowLoginModal} featureName="Quiz Generator" />
      </>
    )
  }

  if (quizState === "results") {
    const isLowScore = score < 60
    const scoreColor = score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-destructive"

    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
        <div className="mb-6 space-y-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">Quiz Complete!</h1>
          <p className="text-muted-foreground">Here are your results</p>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="space-y-6 p-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Trophy className="h-10 w-10 text-primary" />
              </div>
              <p className={`mb-2 text-5xl font-bold ${scoreColor}`}>{score}%</p>
              <p className="text-muted-foreground">Your Score</p>
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Topic</span><span className="font-medium capitalize text-foreground">{topic}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Correct Answers</span><span className="font-medium text-foreground">{correctCount}/{questions.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Questions</span><span className="font-medium text-foreground">{questions.length}</span></div>
            </div>

            <div className="space-y-2 border-t border-border pt-2">
              <p className="mb-3 text-sm font-medium text-foreground">Question Review</p>
              {questions.map((q, i) => {
                const userAnswer = answers[i]
                const isCorrect = userAnswer === q.answer
                return (
                  <div key={i} className={`rounded-lg border p-3 text-sm ${isCorrect ? "border-emerald-500/20 bg-emerald-500/5" : "border-destructive/20 bg-destructive/5"}`}>
                    <div className="flex items-start gap-2">
                      {isCorrect ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> : <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{q.question}</p>
                        {!isCorrect && <p className="mt-1 text-xs text-emerald-600">✓ Correct: {q.answer}</p>}
                        {q.explanation && <p className="mt-1 text-xs text-muted-foreground">{q.explanation}</p>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {isLowScore && (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <p className="text-sm font-medium text-foreground">Need more practice?</p>
                </div>
                <Button className="w-full gap-2" onClick={() => (window.location.href = `/ai-tutor?q=${encodeURIComponent(`Explain ${topic} in detail`)}`)}>
                  <BookOpen className="h-4 w-4" />
                  Study this topic with AI Tutor
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleRetry}>New Topic</Button>
          <Button className="flex-1 gap-2" onClick={handleRetakeQuiz}><RefreshCw className="h-4 w-4" />Retry Quiz</Button>
        </div>
      </div>
    )
  }

  const isCorrectAnswer = selectedAnswer === currentQuestion?.answer

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Question {currentIndex + 1} of {questions.length}</span>
          <span className="font-medium capitalize text-foreground">{topic}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="border-border bg-card">
        <CardContent className="space-y-6 p-6">
          <h2 className="text-lg font-semibold leading-snug text-foreground">{currentQuestion?.question}</h2>

          <RadioGroup value={selectedAnswer ?? ""} onValueChange={(value) => !isAnswered && setSelectedAnswer(value)}>
            <div className="space-y-3">
              {currentQuestion?.options.map((option, index) => {
                const isCorrect = option === currentQuestion.answer
                const isSelected = selectedAnswer === option
                return (
                  <div key={index} className={cn("flex cursor-pointer items-center space-x-3 rounded-lg border p-4 transition-all", isAnswered && isCorrect && "border-emerald-500 bg-emerald-500/10", isAnswered && isSelected && !isCorrect && "border-destructive bg-destructive/10", !isAnswered && isSelected && "border-primary bg-primary/5", !isAnswered && !isSelected && "border-border hover:border-primary/50")}>
                    <RadioGroupItem value={option} id={`opt-${index}`} disabled={isAnswered} />
                    <Label htmlFor={`opt-${index}`} className={cn("flex-1 cursor-pointer text-foreground", isAnswered && "cursor-default")}>{option}</Label>
                    {isAnswered && isCorrect && <Check className="h-5 w-5 shrink-0 text-emerald-500" />}
                    {isAnswered && isSelected && !isCorrect && <X className="h-5 w-5 shrink-0 text-destructive" />}
                  </div>
                )
              })}
            </div>
          </RadioGroup>

          {isAnswered && currentQuestion?.explanation && (
            <div className="rounded-lg bg-secondary p-4">
              <p className="mb-1 text-sm font-medium text-foreground">Explanation:</p>
              <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {answers.filter((a, i) => a === questions[i]?.answer).length} correct so far
            </span>
            {!isAnswered ? (
              <Button onClick={handleSubmitAnswer} disabled={selectedAnswer === null}>Submit Answer</Button>
            ) : (
              <Button onClick={handleNextQuestion} className="gap-2">
                {currentIndex < questions.length - 1 ? <>Next Question <ChevronRight className="h-4 w-4" /></> : "View Results"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
