export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { requireAiAccess } from "@/lib/ai-guard"
import { generateAlternateExplanation, EXPLAIN_STYLE_LABELS, type ExplainStyle } from "@/lib/ai"
import { logUsage } from "@/lib/database"
import { getSupabaseAdmin } from "@/lib/supabase-server"

const VALID_STYLES: ExplainStyle[] = ["simpler", "analogy", "step-by-step", "real-world"]

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAiAccess()
    if (guard.error) return guard.error
    const { user } = guard

    const body = await req.json().catch(() => null)
    const question = typeof body?.question === "string" ? body.question.trim() : ""
    const previousAnswer = typeof body?.previousAnswer === "string" ? body.previousAnswer.trim() : ""
    const style = body?.style as ExplainStyle
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : undefined

    if (!VALID_STYLES.includes(style)) {
      return NextResponse.json(
        { error: "style must be one of: simpler, analogy, step-by-step, real-world" },
        { status: 400 }
      )
    }

    if (!question || !previousAnswer) {
      return NextResponse.json({ error: "question and previousAnswer are required" }, { status: 400 })
    }

    const explanation = await generateAlternateExplanation(question, previousAnswer, style)
    const reply = `> **Explained differently — ${EXPLAIN_STYLE_LABELS[style]}**\n\n${explanation}`

    if (sessionId) {
      const admin = await getSupabaseAdmin()
      const now = new Date().toISOString()

      await admin.from("chat_messages").insert({
        session_id: sessionId,
        user_id: user.id,
        role: "assistant",
        content: reply,
        created_at: now,
      })

      await admin
        .from("chat_sessions")
        .update({ last_message_at: now, updated_at: now })
        .eq("id", sessionId)
        .eq("user_id", user.id)

      logUsage(user.id, "ai_chat", "explain_differently", {
        sessionId,
        style,
      }).catch((err) => {
        console.error("[ai/chat/explain] Failed to log usage metrics:", err)
      })
    }

    return NextResponse.json({ success: true, reply, style })
  } catch (err) {
    console.error("[ai/chat/explain] Error:", err)
    const message = err instanceof Error ? err.message : "Failed to generate alternate explanation"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
