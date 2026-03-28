export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { logUsage, saveQuizAttempt } from "@/lib/database"

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
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { topic, questions, answers } = await req.json() as {
      topic: string
      questions: QuizQuestion[]
      answers: QuizAnswer[]
    }

    if (!topic || !Array.isArray(questions) || !Array.isArray(answers) || questions.length === 0) {
      return NextResponse.json({ error: "Invalid quiz submission" }, { status: 400 })
    }

    const evaluatedAnswers = questions.map((question) => {
      const submitted = answers.find((answer) => answer.questionId === question.id)

      return {
        questionId: question.id,
        selectedOptionId: submitted?.selectedOptionId ?? null,
        isCorrect: submitted?.selectedOptionId === question.correctOptionId,
      }
    })

    const score = evaluatedAnswers.filter((answer) => answer.isCorrect).length
    const totalQuestions = questions.length
    const percentage = Number(((score / totalQuestions) * 100).toFixed(2))

    const savedAttempt = await saveQuizAttempt(user.id, {
      topic,
      questions,
      answers: evaluatedAnswers,
      score,
      totalQuestions,
      percentage,
    })

    await logUsage(user.id, "quiz", "quiz_completed", {
      topic,
      score,
      totalQuestions,
      percentage,
      attemptId: savedAttempt.id,
    }).catch(() => undefined)

    return NextResponse.json({
      success: true,
      result: {
        score,
        totalQuestions,
        percentage,
        answers: evaluatedAnswers,
        savedAttempt,
      },
    })
  } catch (err) {
    console.error("[ai/quiz/submit] Error:", err)
    const message = err instanceof Error ? err.message : "Failed to submit quiz"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}