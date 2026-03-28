// export const dynamic = "force-dynamic"
// import { NextResponse } from "next/server"
// import { getUser } from "@/lib/auth-server"
// import { getSupabaseAdmin } from "@/lib/supabase-server"

// export async function GET() {
//   try {
//     const user = await getUser()
//     if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//     const admin = await getSupabaseAdmin()

//     const { data: logs } = await admin
//       .from("usage_logs")
//       .select("metadata, created_at")
//       .eq("user_id", user.id)
//       .eq("feature", "quiz")
//       .eq("action", "quiz_completed")
//       .order("created_at", { ascending: false })
//       .limit(10)

//     const scores = (logs || []).map((l) => {
//       const meta = (l.metadata || {}) as Record<string, unknown>
//       return {
//         topic: String(meta.topic || "Quiz"),
//         score: Number(meta.score ?? 0),
//         total: Number(meta.total ?? meta.count ?? 5),
//         date: l.created_at,
//       }
//     })

//     return NextResponse.json({ scores })
//   } catch (err) {
//     console.error("[user/quiz-scores]", err)
//     return NextResponse.json({ scores: [] })
//   }
// }
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getSavedQuizAttempts } from "@/lib/database"

export async function GET() {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ scores: [] })
    }

    const attempts = await getSavedQuizAttempts(user.id, 5)

    const scores = (attempts || []).map((attempt) => ({
      id: attempt.id,
      topic: attempt.topic || "Quiz",
      score: Number(attempt.percentage ?? 0),
      correctAnswers: Number(attempt.score ?? 0),
      totalQuestions: Number(attempt.total_questions ?? 0),
      date: attempt.created_at,
    }))

    return NextResponse.json({ scores })
  } catch (err) {
    console.error("[user/quiz-scores] Error:", err)
    return NextResponse.json({ scores: [] })
  }
}