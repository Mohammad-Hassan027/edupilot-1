// export const dynamic = "force-dynamic"

// import { NextRequest, NextResponse } from "next/server"
// import { getUser } from "@/lib/auth-server"
// import { generateQuiz } from "@/lib/ai"
// import {
//   getSubscription,
//   isTrialActive,
//   logUsage,
//   getSavedQuizAttempts,
// } from "@/lib/database"

// type GeneratedQuizQuestion = {
//   question: string
//   options: string[]
//   answer: string
//   explanation?: string
// }

// export async function GET() {
//   try {
//     const user = await getUser()

//     if (!user) {
//       return NextResponse.json({ attempts: [] })
//     }

//     const attempts = await getSavedQuizAttempts(user.id, 12)
//     return NextResponse.json({ attempts })
//   } catch (err) {
//     console.error("[ai/quiz][GET] Error:", err)
//     const message = err instanceof Error ? err.message : "Failed to load quiz history"
//     return NextResponse.json({ error: message }, { status: 500 })
//   }
// }

// export async function POST(req: NextRequest) {
//   try {
//     const user = await getUser()

//     if (!user) {
//       return NextResponse.json(
//         {
//           error: "Login required to generate quiz.",
//           code: "UNAUTHORIZED",
//           requiresLogin: true,
//         },
//         { status: 401 }
//       )
//     }

//     const body = await req.json().catch(() => null)
//     const topic = typeof body?.topic === "string" ? body.topic.trim() : ""
//     const count = Math.min(Math.max(Number(body?.count) || 5, 1), 10)

//     if (!topic) {
//       return NextResponse.json({ error: "Topic is required" }, { status: 400 })
//     }

//     const subscription = await getSubscription(user.id)
//     const paidTrialActive = await isTrialActive(user.id)
//     const hasPremiumPlan = subscription?.plan_id === "premium"

//     const canUseQuiz = Boolean(
//       hasPremiumPlan &&
//         (paidTrialActive || subscription?.status === "active" || subscription?.status === "trial")
//     )

//     if (!canUseQuiz) {
//       return NextResponse.json(
//         {
//           error: "Quiz is available on the Premium plan only. Start your 14-day free trial to continue.",
//           code: "PLAN_REQUIRED",
//           requiresUpgrade: true,
//         },
//         { status: 402 }
//       )
//     }

//     const quiz = await generateQuiz(topic, count)

//     const formattedQuestions = (quiz as GeneratedQuizQuestion[]).map((item, questionIndex) => {
//       const options = Array.isArray(item.options) ? item.options.slice(0, 4) : []

//       const normalizedOptions =
//         options.length === 4
//           ? options
//           : ["Option A", "Option B", "Option C", "Option D"]

//       const optionObjects = normalizedOptions.map((optionText, optionIndex) => ({
//         id: `q${questionIndex + 1}_o${optionIndex + 1}`,
//         text: String(optionText),
//       }))

//       const matchedCorrect =
//         optionObjects.find(
//           (option) =>
//             option.text.trim().toLowerCase() === String(item.answer || "").trim().toLowerCase()
//         ) || optionObjects[0]

//       return {
//         id: `q${questionIndex + 1}`,
//         question: String(item.question || `Question ${questionIndex + 1}`),
//         options: optionObjects,
//         correctOptionId: matchedCorrect.id,
//         explanation: item.explanation ? String(item.explanation) : "",
//       }
//     })

//     await logUsage(user.id, "quiz", "quiz_generated", {
//       topic,
//       count: formattedQuestions.length,
//       planId: subscription?.plan_id,
//       generatedAt: new Date().toISOString(),
//     }).catch(() => undefined)

//     return NextResponse.json({
//       success: true,
//       quiz: {
//         topic,
//         questions: formattedQuestions,
//       },
//     })
//   } catch (err) {
//     console.error("[ai/quiz][POST] Error:", err)
//     const message = err instanceof Error ? err.message : "Failed to generate quiz"
//     return NextResponse.json({ error: message }, { status: 500 })
//   }
// }
export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { generateQuiz, generateQuizFromContent, type QuizDifficulty } from "@/lib/ai"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import {
  getSubscription,
  isTrialActive,
  logUsage,
  getSavedQuizAttempts,
  getSavedNoteById,
  type QuizSourceType,
} from "@/lib/database"

type GeneratedQuizQuestion = {
  question: string
  options: string[]
  answer: string
  explanation?: string
}

const VALID_DIFFICULTIES: QuizDifficulty[] = ["easy", "medium", "hard"]

async function loadQuizSourceMaterial(
  userId: string,
  sourceType: QuizSourceType,
  sourceId: string
): Promise<{ topic: string; content: string } | null> {
  if (sourceType === "note") {
    const note = await getSavedNoteById(userId, sourceId)
    if (!note) return null

    const content = note.tabs.map((tab) => `${tab.title}\n${tab.content}`).join("\n\n")
    return { topic: note.source_title, content }
  }

  if (sourceType === "chat") {
    const admin = await getSupabaseAdmin()
    const { data: messages, error } = await admin
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", sourceId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true })

    if (error || !messages?.length) return null

    const content = messages.map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`).join("\n\n")

    const { data: session } = await admin
      .from("chat_sessions")
      .select("title, topic")
      .eq("id", sourceId)
      .eq("user_id", userId)
      .maybeSingle()

    return { topic: session?.title || session?.topic || "Chat Session", content }
  }

  return null
}

export async function GET() {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ attempts: [] })
    }

    const attempts = await getSavedQuizAttempts(user.id, 12)
    return NextResponse.json({ attempts })
  } catch (err) {
    console.error("[ai/quiz][GET] Error:", err)
    const message = err instanceof Error ? err.message : "Failed to load quiz history"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        {
          error: "Login required to generate quiz.",
          code: "UNAUTHORIZED",
          requiresLogin: true,
        },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => null)
    const topic = typeof body?.topic === "string" ? body.topic.trim() : ""
    const count = Math.min(Math.max(Number(body?.count) || 5, 1), 10)
    const difficulty: QuizDifficulty = VALID_DIFFICULTIES.includes(body?.difficulty)
      ? body.difficulty
      : "medium"
    const sourceType = body?.sourceType as QuizSourceType | undefined
    const sourceId = typeof body?.sourceId === "string" ? body.sourceId : ""
    const isFromSource = sourceType === "note" || sourceType === "chat"

    if (!isFromSource && !topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
    }

    if (isFromSource && !sourceId) {
      return NextResponse.json({ error: "sourceId is required" }, { status: 400 })
    }

    const subscription = await getSubscription(user.id)
    const paidTrialActive = await isTrialActive(user.id)
    const hasPremiumPlan = subscription?.plan_id === "premium"

    const canUseQuiz = Boolean(
      hasPremiumPlan &&
        (paidTrialActive || subscription?.status === "active" || subscription?.status === "trial")
    )

    if (!canUseQuiz) {
      return NextResponse.json(
        {
          error: "Quiz is available on the Premium plan only. Start your 14-day free trial to continue.",
          code: "PLAN_REQUIRED",
          requiresUpgrade: true,
        },
        { status: 402 }
      )
    }

    let resolvedTopic = topic
    let quiz: Awaited<ReturnType<typeof generateQuiz>>

    if (isFromSource) {
      const source = await loadQuizSourceMaterial(user.id, sourceType as QuizSourceType, sourceId)
      if (!source) {
        return NextResponse.json({ error: "Could not find the selected note or chat session" }, { status: 404 })
      }

      resolvedTopic = source.topic
      quiz = await generateQuizFromContent(source.topic, source.content, count, difficulty)
    } else {
      quiz = await generateQuiz(topic, count, difficulty)
    }

    const formattedQuestions = (quiz as GeneratedQuizQuestion[]).map((item, questionIndex) => {
      const options = Array.isArray(item.options) ? item.options.slice(0, 4) : []

      const normalizedOptions =
        options.length === 4
          ? options
          : ["Option A", "Option B", "Option C", "Option D"]

      const optionObjects = normalizedOptions.map((optionText, optionIndex) => ({
        id: `q${questionIndex + 1}_o${optionIndex + 1}`,
        text: String(optionText),
      }))

      const matchedCorrect =
        optionObjects.find(
          (option) =>
            option.text.trim().toLowerCase() === String(item.answer || "").trim().toLowerCase()
        ) || optionObjects[0]

      return {
        id: `q${questionIndex + 1}`,
        question: String(item.question || `Question ${questionIndex + 1}`),
        options: optionObjects,
        correctOptionId: matchedCorrect.id,
        explanation: item.explanation ? String(item.explanation) : "",
      }
    })

    await logUsage(user.id, "quiz", "quiz_generated", {
      topic: resolvedTopic,
      difficulty,
      count: formattedQuestions.length,
      planId: subscription?.plan_id,
      sourceType: isFromSource ? sourceType : "topic",
      sourceId: isFromSource ? sourceId : null,
      generatedAt: new Date().toISOString(),
    }).catch(() => undefined)

    return NextResponse.json({
      success: true,
      quiz: {
        topic: resolvedTopic,
        difficulty,
        sourceType: isFromSource ? sourceType : "topic",
        sourceId: isFromSource ? sourceId : null,
        questions: formattedQuestions,
      },
    })
  } catch (err) {
    console.error("[ai/quiz][POST] Error:", err)
    const message = err instanceof Error ? err.message : "Failed to generate quiz"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}