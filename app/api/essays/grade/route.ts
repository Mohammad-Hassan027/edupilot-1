import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { gradeEssay } from "@/lib/ai"
import { consumeCredit } from "@/lib/credits"

export const maxDuration = 60 // Extended duration for long essay evaluations

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const creditCheck = await consumeCredit(user.id, "ai_chat")
    if (!creditCheck.allowed) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 403 })
    }

    const { content, rubric } = await req.json()

    if (!content || content.trim().length < 50) {
      return NextResponse.json({ error: "Essay content is too short." }, { status: 400 })
    }

    // Call Gemini to grade the essay
    const feedback = await gradeEssay(content, rubric)

    // Save to database
    const { data: evaluation, error: dbError } = await supabase
      .from("essay_evaluations")
      .insert({
        user_id: user.id,
        content: content,
        rubric: rubric || null,
        grade: feedback.grade,
        feedback: feedback
      })
      .select("id")
      .single()

    if (dbError || !evaluation) {
      console.error("[Essay Grader DB Error]", dbError)
      return NextResponse.json({ error: "Failed to save evaluation." }, { status: 500 })
    }

    return NextResponse.json({ id: evaluation.id })
  } catch (error: any) {
    console.error("[Essay Grader Error]", error)
    return NextResponse.json(
      { error: error.message || "Failed to grade essay" },
      { status: 500 }
    )
  }
}
