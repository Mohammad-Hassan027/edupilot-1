"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Brain, 
  Sparkles, 
  Check, 
  X, 
  RefreshCw,
  Trophy,
  Target,
  AlertTriangle,
  ChevronRight,
  BookOpen,
  ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Question {
  id: string
  question: string
  type: "multiple-choice" | "true-false"
  options: string[]
  correctAnswer: number
  explanation: string
}

const sampleQuestions: Question[] = [
  {
    id: "1",
    type: "multiple-choice",
    question: "What is the derivative of x²?",
    options: ["x", "2x", "2x²", "x/2"],
    correctAnswer: 1,
    explanation: "Using the power rule, d/dx(x^n) = nx^(n-1), so d/dx(x²) = 2x.",
  },
  {
    id: "2",
    type: "multiple-choice",
    question: "Which of the following is NOT a type of machine learning?",
    options: ["Supervised Learning", "Unsupervised Learning", "Reinforced Learning", "Compiled Learning"],
    correctAnswer: 3,
    explanation: "Compiled Learning is not a type of machine learning. The three main types are Supervised, Unsupervised, and Reinforcement Learning.",
  },
  {
    id: "3",
    type: "true-false",
    question: "The chemical symbol for gold is Au.",
    options: ["True", "False"],
    correctAnswer: 0,
    explanation: "Au comes from the Latin word 'aurum' meaning gold.",
  },
  {
    id: "4",
    type: "multiple-choice",
    question: "In which year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correctAnswer: 2,
    explanation: "World War II ended in 1945 with the surrender of Japan on September 2, 1945.",
  },
  {
    id: "5",
    type: "true-false",
    question: "The skin is the largest organ in the human body.",
    options: ["True", "False"],
    correctAnswer: 0,
    explanation: "The skin is the largest organ, covering about 20 square feet in adults.",
  },
]

type QuizState = "setup" | "active" | "results"

export default function QuizPage() {
  const [quizState, setQuizState] = useState<QuizState>("setup")
  const [topic, setTopic] = useState("")
  const [questionCount, setQuestionCount] = useState("10")
  const [questionType, setQuestionType] = useState<"all" | "multiple-choice" | "true-false">("all")
  const [questions, setQuestions] = useState<Question[]>(sampleQuestions)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAddingQuestion, setIsAddingQuestion] = useState(false)
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    type: "multiple-choice" as "multiple-choice" | "true-false",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
  })

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100

  const handleGenerateQuiz = async () => {
    setIsGenerating(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setQuestions(sampleQuestions)
    setQuizState("active")
    setIsGenerating(false)
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return
    setAnswers([...answers, selectedAnswer])
    setIsAnswered(true)
  }

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
    } else {
      setQuizState("results")
    }
  }

  const handleRetry = () => {
    setQuizState("setup")
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setIsAnswered(false)
    setAnswers([])
    setTopic("")
  }

  const handleAddQuestion = () => {
    if (!newQuestion.question.trim()) return
    
    const questionOptions = newQuestion.type === "true-false" 
      ? ["True", "False"]
      : newQuestion.options.filter(o => o.trim())
    
    if (questionOptions.length < 2) return

    const question: Question = {
      id: Date.now().toString(),
      question: newQuestion.question,
      type: newQuestion.type,
      options: questionOptions,
      correctAnswer: newQuestion.correctAnswer,
      explanation: newQuestion.explanation,
    }
    
    setQuestions([...questions, question])
    setNewQuestion({
      question: "",
      type: "multiple-choice",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
    })
    setIsAddingQuestion(false)
  }

  const handleSaveQuizScore = async () => {
    // Save quiz score to localStorage for dashboard display
    const quizResult = {
      score,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      topic: topic || "Manual Quiz",
      date: new Date().toISOString(),
    }
    
    const results = JSON.parse(localStorage.getItem("quizResults") || "[]")
    results.push(quizResult)
    localStorage.setItem("quizResults", JSON.stringify(results))
  }

  const correctCount = answers.filter((a, i) => a === questions[i]?.correctAnswer).length
  const score = Math.round((correctCount / questions.length) * 100)

  const weakTopics = ["Derivatives", "Chemical Symbols"]

  if (quizState === "setup") {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Quiz Generator</h1>
          <p className="text-muted-foreground">Enter a topic and let AI create a quiz for you</p>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="p-6 space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
              <Brain className="h-8 w-8 text-primary" />
            </div>

            <div className="space-y-3">
              <Label htmlFor="topic">Quiz Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., Calculus, Machine Learning, World History..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="count">Number of Questions</Label>
                <Select value={questionCount} onValueChange={setQuestionCount}>
                  <SelectTrigger id="count" className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 15, 20, 25, 30, 40, 50].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} Questions
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="type">Question Type</Label>
                <Select value={questionType} onValueChange={(val) => setQuestionType(val as any)}>
                  <SelectTrigger id="type" className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                    <SelectItem value="true-false">True/False</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleGenerateQuiz}
              disabled={!topic.trim() || isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating Quiz...
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
    )
  }

  if (quizState === "results") {
    const isLowScore = score < 60
    const getQuizTypeLabel = (type: "all" | "multiple-choice" | "true-false") => {
      switch(type) {
        case "multiple-choice": return "Multiple Choice"
        case "true-false": return "True/False"
        default: return "Mixed Types"
      }
    }

    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-2xl font-bold text-foreground">Quiz Complete!</h1>
          <p className="text-muted-foreground">Here are your results</p>
        </div>

        {/* Quiz Results Card */}
        <Card className="border-border bg-card">
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
                <Trophy className="h-10 w-10 text-primary" />
              </div>
              <p className="text-5xl font-bold text-foreground mb-2">{score}%</p>
              <p className="text-muted-foreground">Your Score</p>
            </div>

            {/* Quiz Info */}
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Quiz Topic</span>
                <span className="font-medium text-foreground">{topic || "Quiz"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Quiz Type</span>
                <span className="font-medium text-foreground">{getQuizTypeLabel(questionType)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Correct Answers</span>
                <span className="font-medium text-foreground">{correctCount}/{questions.length}</span>
              </div>
            </div>

            {/* Areas to Improve */}
            {isLowScore && (
              <>
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <p className="font-medium text-foreground">Need Help?</p>
                  </div>
                  <Button 
                    className="w-full gap-2 bg-primary hover:bg-primary/90"
                    onClick={() => {
                      handleSaveQuizScore()
                      window.location.href = `/ai-tutor?topic=${encodeURIComponent(topic)}`
                    }}
                  >
                    <BookOpen className="h-4 w-4" />
                    Learn More About This Topic Using AI Tutor
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => {
            handleSaveQuizScore()
            handleRetry()
          }}>
            New Quiz
          </Button>
          <Button className="flex-1 gap-2" onClick={() => {
            handleSaveQuizScore()
            setQuizState("active")
          }}>
            <RefreshCw className="h-4 w-4" />
            Retry Quiz
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Question {currentIndex + 1} of {questions.length}</span>
          <span className="text-foreground font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="border-border bg-card">
        <CardContent className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-foreground">{currentQuestion.question}</h2>

          <RadioGroup
            value={selectedAnswer?.toString()}
            onValueChange={(value) => !isAnswered && setSelectedAnswer(parseInt(value))}
          >
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isCorrect = index === currentQuestion.correctAnswer
                const isSelected = selectedAnswer === index

                return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg border p-4 transition-all",
                      isAnswered && isCorrect && "border-emerald-500 bg-emerald-500/10",
                      isAnswered && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                      !isAnswered && isSelected && "border-primary bg-primary/5",
                      !isAnswered && !isSelected && "border-border hover:border-primary/50 cursor-pointer"
                    )}
                  >
                    <RadioGroupItem
                      value={index.toString()}
                      id={`option-${index}`}
                      disabled={isAnswered}
                    />
                    <Label
                      htmlFor={`option-${index}`}
                      className={cn(
                        "flex-1 cursor-pointer text-foreground",
                        isAnswered && "cursor-default"
                      )}
                    >
                      {option}
                    </Label>
                    {isAnswered && isCorrect && (
                      <Check className="h-5 w-5 text-emerald-500" />
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <X className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                )
              })}
            </div>
          </RadioGroup>

          {isAnswered && (
            <div className="rounded-lg bg-secondary p-4">
              <p className="text-sm font-medium text-foreground mb-1">Explanation:</p>
              <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
            </div>
          )}

          <div className="flex justify-end">
            {!isAnswered ? (
              <Button onClick={handleSubmitAnswer} disabled={selectedAnswer === null}>
                Submit Answer
              </Button>
            ) : (
              <Button onClick={handleNextQuestion} className="gap-2">
                {currentIndex < questions.length - 1 ? (
                  <>
                    Next Question
                    <ChevronRight className="h-4 w-4" />
                  </>
                ) : (
                  "View Results"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
