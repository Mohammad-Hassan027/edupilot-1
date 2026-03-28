export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getSupabaseAdmin } from "@/lib/supabase-server"

type ActivityItem = {
  id: string
  feature: string
  action: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export async function GET() {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ activity: [] }, { status: 200 })
    }

    const admin = await getSupabaseAdmin()

    const [
      { data: sessions, error: sessionsError },
      { data: logs, error: logsError },
      { data: savedNotes, error: savedNotesError },
      { data: savedFlashcards, error: savedFlashcardsError },
    ] = await Promise.all([
      admin
        .from("chat_sessions")
        .select("id, topic, title, last_message_at")
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false })
        .limit(8),

      admin
        .from("usage_logs")
        .select("id, feature, metadata, created_at")
        .eq("user_id", user.id)
        .neq("feature", "flashcards")
        .order("created_at", { ascending: false })
        .limit(20),

      admin
        .from("saved_notes")
        .select("id, source_title, source_hint, source_label, source_type, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8),

      admin
        .from("saved_flashcard_sets")
        .select("id, topic, card_count, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8),
    ])

    if (sessionsError) {
      console.error("[user/recent-activity] chat_sessions:", sessionsError)
    }

    const logsTableMissing =
      logsError?.message?.toLowerCase().includes("usage_logs") ||
      logsError?.message?.toLowerCase().includes("column") ||
      false

    if (logsError && !logsTableMissing) {
      console.error("[user/recent-activity] usage_logs:", logsError)
    }

    const savedNotesTableMissing =
      savedNotesError?.message?.toLowerCase().includes("saved_notes") ||
      savedNotesError?.message?.toLowerCase().includes("column") ||
      false

    if (savedNotesError && !savedNotesTableMissing) {
      console.error("[user/recent-activity] saved_notes:", savedNotesError)
    }

    const savedFlashcardsTableMissing =
      savedFlashcardsError?.message?.toLowerCase().includes("saved_flashcard_sets") ||
      savedFlashcardsError?.message?.toLowerCase().includes("column") ||
      false

    if (savedFlashcardsError && !savedFlashcardsTableMissing) {
      console.error("[user/recent-activity] saved_flashcard_sets:", savedFlashcardsError)
    }

    const chatActivity: ActivityItem[] = (sessions || []).map((session) => ({
      id: session.id,
      feature: "ai_chat",
      action: "question_asked",
      metadata: {
        topic: session.topic || session.title || "New Chat",
      },
      created_at: session.last_message_at,
    }))

    const usageActivity: ActivityItem[] = logsTableMissing
      ? []
      : (logs || []).map((log: any) => ({
          id: log.id,
          feature: log.feature,
          action:
            typeof log?.metadata?.action === "string"
              ? log.metadata.action
              : `${log.feature || "activity"}_used`,
          metadata: log.metadata || null,
          created_at: log.created_at,
        }))

    const noteActivity: ActivityItem[] = savedNotesTableMissing
      ? []
      : (savedNotes || []).map((note: any) => ({
          id: note.id,
          feature: "notes",
          action: "notes_generated",
          metadata: {
            topic: note.source_title || note.source_label || note.source_type || "Saved Note",
            sourceHint: note.source_hint || null,
          },
          created_at: note.created_at,
        }))

    const flashcardActivity: ActivityItem[] = savedFlashcardsTableMissing
      ? []
      : (savedFlashcards || []).map((set: any) => ({
          id: set.id,
          feature: "flashcards",
          action: "flashcards_generated",
          metadata: {
            topic: set.topic || "Flashcards",
            count: set.card_count || 0,
          },
          created_at: set.created_at,
        }))

    const activity = [...chatActivity, ...usageActivity, ...noteActivity, ...flashcardActivity]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20)

    return NextResponse.json({ activity })
  } catch (err) {
    console.error("[user/recent-activity]", err)
    return NextResponse.json({ activity: [] })
  }
}