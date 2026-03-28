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
import { generateQuiz } from "@/lib/ai"
import {
  getSubscription,
  isTrialActive,
  logUsage,
  getSavedQuizAttempts,
} from "@/lib/database"

type GeneratedQuizQuestion = {
  question: string
  options: string[]
  answer: string
  explanation?: string
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

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
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

    const quiz = await generateQuiz(topic, count)

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
      topic,
      count: formattedQuestions.length,
      planId: subscription?.plan_id,
      generatedAt: new Date().toISOString(),
    }).catch(() => undefined)

    return NextResponse.json({
      success: true,
      quiz: {
        topic,
        questions: formattedQuestions,
      },
    })
  } catch (err) {
    console.error("[ai/quiz][POST] Error:", err)
    const message = err instanceof Error ? err.message : "Failed to generate quiz"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}