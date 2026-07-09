export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { requireAiAccess } from "@/lib/ai-guard"
import { getUser } from "@/lib/auth-server"
import { analyzeTopic } from "@/lib/ai"
import {
  getTopicAnalysisHistory,
  saveTopicAnalysis,
  deleteTopicAnalysis,
  logUsage,
} from "@/lib/database"

export async function GET() {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Login required", code: "UNAUTHORIZED" },
        { status: 401 }
      )
    }

    const history = await getTopicAnalysisHistory(user.id)
    return NextResponse.json({ success: true, history })
  } catch (err) {
    console.error("[api/topic-analysis] GET Error:", err)
    const message = err instanceof Error ? err.message : "Failed to load analysis history"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Guard access (Auth, Rate Limiting, 1 AI Chat Credit consumption)
    const guard = await requireAiAccess("ai_chat")
    if (guard.error) return guard.error
    const { user } = guard

    // 2. Parse and validate input
    const body = await req.json().catch(() => ({}))
    const topic = body.topic

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json(
        { error: "Topic is required and must be a valid string." },
        { status: 400 }
      )
    }

    const cleanTopic = topic.trim()
    if (cleanTopic.length > 100) {
      return NextResponse.json(
        { error: "Topic input is too long (maximum 100 characters)." },
        { status: 400 }
      )
    }

    // 3. Generate analysis from AI
    const analysisResult = await analyzeTopic(cleanTopic)

    // 4. Save to user history in DB
    const savedRecord = await saveTopicAnalysis(user.id, cleanTopic, analysisResult)

    // 5. Log usage metrics
    await logUsage(user.id, "topic_analyzer", "topic_analyzed", {
      topic: cleanTopic,
      difficulty: analysisResult.difficulty,
      confidence: analysisResult.confidence,
      savedId: savedRecord.id,
    }).catch((err) => {
      console.error("[api/topic-analysis] Failed to log usage metrics:", err)
    })

    // 6. Return response matching requested schema, augmented with record details
    return NextResponse.json({
      success: true,
      id: savedRecord.id,
      ...analysisResult,
    })
  } catch (err) {
    console.error("[api/topic-analysis] POST Error:", err)
    const message = err instanceof Error ? err.message : "Failed to analyze topic"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Login required", code: "UNAUTHORIZED" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Analysis ID is required" },
        { status: 400 }
      )
    }

    await deleteTopicAnalysis(user.id, id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[api/topic-analysis] DELETE Error:", err)
    const message = err instanceof Error ? err.message : "Failed to delete history item"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
