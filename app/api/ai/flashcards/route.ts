export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { generateFlashcards, generateFlashcardsFromContent } from "@/lib/ai"
import { getSupabaseAdmin } from "@/lib/supabase-server"
import { awardXp, checkAndUnlockAchievements, XP_VALUES } from "@/lib/goals-db"
import {
  logUsage,
  getSubscription,
  isTrialActive,
  getSavedFlashcardSets,
  saveFlashcardSet,
  getSavedNoteById,
  type FlashcardSourceType,
} from "@/lib/database"

async function resolveSourceMaterial(
  userId: string,
  sourceType: FlashcardSourceType,
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
      return NextResponse.json({ sets: [] })
    }

    const sets = await getSavedFlashcardSets(user.id, 12)
    return NextResponse.json({ sets })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load flashcard history"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Login required to generate flashcards.", code: "UNAUTHORIZED", requiresLogin: true },
        { status: 401 }
      )
    }

    const { topic, count = 10, sourceType, sourceId } = await req.json()

    const isFromSource = sourceType === "note" || sourceType === "chat"

    if (!isFromSource && (!topic || typeof topic !== "string" || topic.trim().length === 0)) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 })
    }

    if (isFromSource && (!sourceId || typeof sourceId !== "string")) {
      return NextResponse.json({ error: "sourceId is required" }, { status: 400 })
    }

    const subscription = await getSubscription(user.id)
    const paidTrialActive = await isTrialActive(user.id)
    const hasPaidPlan = subscription?.plan_id === "pro" || subscription?.plan_id === "premium"
    const canUseFlashcards = Boolean(
      hasPaidPlan && (paidTrialActive || subscription?.status === "active" || subscription?.status === "trial")
    )

    if (!canUseFlashcards) {
      return NextResponse.json(
        {
          error: "Flashcards is available on Pro and Premium plans only. Start your 14-day free trial to continue.",
          code: "PLAN_REQUIRED",
          requiresUpgrade: true,
        },
        { status: 402 }
      )
    }

    const totalCards = Math.min(Number(count) || 10, 20)

    let normalizedTopic: string
    let flashcards: Awaited<ReturnType<typeof generateFlashcards>>

    if (isFromSource) {
      const source = await resolveSourceMaterial(user.id, sourceType, sourceId)
      if (!source) {
        return NextResponse.json({ error: "Could not find the selected note or chat session" }, { status: 404 })
      }

      normalizedTopic = source.topic
      flashcards = await generateFlashcardsFromContent(source.content, totalCards)
    } else {
      normalizedTopic = topic.trim()
      flashcards = await generateFlashcards(normalizedTopic, totalCards)
    }

    const savedSet = await saveFlashcardSet(user.id, {
      topic: normalizedTopic,
      cards: flashcards.map((card) => ({
        front: card.front,
        back: card.back,
      })),
      sourceType: isFromSource ? sourceType : "topic",
      sourceId: isFromSource ? sourceId : null,
    })

    await logUsage(user.id, "flashcards", "flashcards_generated", {
      topic: normalizedTopic,
      count: flashcards.length,
      planId: subscription?.plan_id,
      firstCardFront: flashcards[0]?.front || null,
      lastCardFront: flashcards[flashcards.length - 1]?.front || null,
      lastGeneratedAt: new Date().toISOString(),
      savedSetId: savedSet.id,
      sourceType: isFromSource ? sourceType : "topic",
      sourceId: isFromSource ? sourceId : null,
    }).catch(console.error)

    // Award XP for Flashcards and check achievements
    awardXp(user.id, XP_VALUES.flashcards).catch((err) => {
      console.error("[ai/flashcards] Failed to award XP:", err);
    });
    checkAndUnlockAchievements(user.id).catch((err) => {
      console.error("[ai/flashcards] Failed to check achievements:", err);
    });

    return NextResponse.json({ success: true, flashcards, savedSet })
  } catch (err) {
    console.error("[ai/flashcards] Error:", err)
    const message = err instanceof Error ? err.message : "Failed to generate flashcards"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}