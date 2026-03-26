export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getSupabaseAdmin } from "@/lib/supabase-server"

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ messages: [] })

    const { sessionId } = await context.params
    const admin = await getSupabaseAdmin()

    const { data: messages, error } = await admin
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[user/chat-history/session] Error:", error)
      return NextResponse.json({ messages: [] }, { status: 500 })
    }

    return NextResponse.json({
      messages: (messages || []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.created_at,
      })),
    })
  } catch (err) {
    console.error("[user/chat-history/session] Error:", err)
    return NextResponse.json({ messages: [] }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { sessionId } = await context.params
    const admin = await getSupabaseAdmin()

    const { error: messagesError } = await admin
      .from("chat_messages")
      .delete()
      .eq("session_id", sessionId)
      .eq("user_id", user.id)

    if (messagesError) {
      console.error("[user/chat-history/session/delete messages] Error:", messagesError)
      return NextResponse.json({ error: "Failed to delete chat" }, { status: 500 })
    }

    const { error: sessionError } = await admin
      .from("chat_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", user.id)

    if (sessionError) {
      console.error("[user/chat-history/session/delete session] Error:", sessionError)
      return NextResponse.json({ error: "Failed to delete chat" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[user/chat-history/session/delete] Error:", err)
    return NextResponse.json({ error: "Failed to delete chat" }, { status: 500 })
  }
}
