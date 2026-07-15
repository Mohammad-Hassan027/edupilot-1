export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { gradeShortAnswer } from "@/lib/ai"
import { logUsage, saveQuizAttempt } from "@/lib/database"

type QuizOption = {
  id: string
  text: string
}

type QuizQuestion = {
  id: string
  type?: "mcq" | "short_answer"
  question: string
  options: QuizOption[]
  correctOptionId: string | null
  expectedAnswer?: string | null
  explanation?: string | null
}

type QuizAnswer = {
  questionId: string
  selectedOptionId: string | null
  textAnswer?: string | null
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { topic, difficulty, questions, answers, sourceType, sourceId } = await req.json() as {
      topic: string
      difficulty?: "easy" | "medium" | "hard"
      questions: QuizQuestion[]
      answers: QuizAnswer[]
      sourceType?: "topic" | "note" | "chat" | "flashcards"
      sourceId?: string | null
    }

    if (!topic || !Array.isArray(questions) || !Array.isArray(answers) || questions.length === 0) {
      return NextResponse.json({ error: "Invalid quiz submission" }, { status: 400 })
    }

    const evaluatedAnswers = await Promise.all(
      questions.map(async (question) => {
        const submitted = answers.find((answer) => answer.questionId === question.id)

        if (question.type === "short_answer") {
          const textAnswer = submitted?.textAnswer?.trim() || ""

          if (!textAnswer) {
            return {
              questionId: question.id,
              selectedOptionId: null,
              textAnswer: null,
              isCorrect: false,
              feedback: "No answer provided.",
            }
          }

          try {
            const grade = await gradeShortAnswer(question.question, question.expectedAnswer || "", textAnswer)
            return {
              questionId: question.id,
              selectedOptionId: null,
              textAnswer,
              isCorrect: grade.isCorrect,
              feedback: grade.feedback,
            }
          } catch (err) {
            console.error("[ai/quiz/submit] Short-answer grading failed:", err)
            return {
              questionId: question.id,
              selectedOptionId: null,
              textAnswer,
              isCorrect: false,
              feedback: "Could not automatically grade this answer.",
            }
          }
        }

        return {
          questionId: question.id,
          selectedOptionId: submitted?.selectedOptionId ?? null,
          isCorrect: submitted?.selectedOptionId === question.correctOptionId,
        }
      })
    )

    const score = evaluatedAnswers.filter((answer) => answer.isCorrect).length
    const totalQuestions = questions.length
    const percentage = Number(((score / totalQuestions) * 100).toFixed(2))

    const savedAttempt = await saveQuizAttempt(user.id, {
      topic,
      difficulty,
      questions,
      answers: evaluatedAnswers,
      score,
      totalQuestions,
      percentage,
      sourceType,
      sourceId,
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