// "use client"

// import { useEffect, useState } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Trophy, Zap } from "lucide-react"
// import { cn } from "@/lib/utils"

// interface QuizResult {
//   score: number
//   totalQuestions: number
//   correctAnswers: number
//   topic: string
//   date: string
// }

// export function QuizScores() {
//   const [results, setResults] = useState<QuizResult[]>([])

//   useEffect(() => {
//     const storedResults = JSON.parse(localStorage.getItem("quizResults") || "[]")
//     setResults(storedResults.sort((a: QuizResult, b: QuizResult) => 
//       new Date(b.date).getTime() - new Date(a.date).getTime()
//     ).slice(0, 5))
//   }, [])

//   if (results.length === 0) {
//     return (
//       <Card className="border-border bg-card">
//         <CardHeader>
//           <CardTitle className="text-base flex items-center gap-2">
//             <Trophy className="h-4 w-4 text-primary" />
//             Recent Quiz Scores
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <p className="text-sm text-muted-foreground text-center py-8">
//             No quiz results yet. Take a quiz to see your scores here.
//           </p>
//         </CardContent>
//       </Card>
//     )
//   }

//   return (
//     <Card className="border-border bg-card">
//       <CardHeader className="pb-3">
//         <CardTitle className="text-base flex items-center gap-2">
//           <Trophy className="h-4 w-4 text-primary flex-shrink-0" />
//           Recent Quiz Scores
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="space-y-2">
//         {results.map((result, idx) => {
//           const scoreColor = result.score >= 80 ? "text-emerald-500" : 
//                             result.score >= 60 ? "text-amber-500" : "text-destructive"
          
//           return (
//             <div
//               key={idx}
//               className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
//             >
//               <div className="flex-1 min-w-0">
//                 <p className="text-sm font-medium text-foreground truncate">{result.topic}</p>
//                 <p className="text-xs text-muted-foreground">
//                   {result.correctAnswers}/{result.totalQuestions} correct
//                 </p>
//               </div>
//               <div className={cn("text-lg font-bold flex-shrink-0", scoreColor)}>
//                 {result.score}%
//               </div>
//             </div>
//           )
//         })}
//       </CardContent>
//     </Card>
//   )
// }
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuizResult {
  id: string
  score: number
  totalQuestions: number
  correctAnswers: number
  topic: string
  date: string
}

function formatDate(dateString: string) {
  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) return ""

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function QuizScores() {
  const [results, setResults] = useState<QuizResult[]>([])
  const [loading, setLoading] = useState(true)

  async function loadQuizScores() {
    try {
      setLoading(true)

      const response = await fetch("/api/user/quiz-scores", {
        cache: "no-store",
      })

      const data = await response.json().catch(() => ({ scores: [] }))

      if (!response.ok) {
        throw new Error(data.error || "Failed to load quiz scores")
      }

      const scores = Array.isArray(data.scores) ? data.scores : []

      setResults(
        scores
          .sort(
            (a: QuizResult, b: QuizResult) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .slice(0, 5)
      )
    } catch (error) {
      console.error("[QuizScores] Error:", error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadQuizScores()

    const handleRefresh = () => {
      void loadQuizScores()
    }

    window.addEventListener("quiz-score-updated", handleRefresh)
    window.addEventListener("focus", handleRefresh)

    return () => {
      window.removeEventListener("quiz-score-updated", handleRefresh)
      window.removeEventListener("focus", handleRefresh)
    }
  }, [])

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Recent Quiz Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Loading quiz scores...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (results.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Recent Quiz Scores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No quiz results yet. Take a quiz to see your scores here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary flex-shrink-0" />
          Recent Quiz Scores
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {results.map((result) => {
          const scoreColor =
            result.score >= 80
              ? "text-emerald-500"
              : result.score >= 60
              ? "text-amber-500"
              : "text-destructive"

          return (
            <div
              key={result.id}
              className="flex items-start justify-between gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {result.topic}
                </p>

                <p className="text-xs text-muted-foreground">
                  {result.correctAnswers}/{result.totalQuestions} correct
                </p>

                <p className="text-[11px] text-muted-foreground mt-1">
                  {formatDate(result.date)}
                </p>
              </div>

              <div className={cn("text-lg font-bold flex-shrink-0", scoreColor)}>
                {result.score}%
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}