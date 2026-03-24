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

    if (!user) {
      return NextResponse.json({ messages: [] }, { status: 200 })
    }

    const { sessionId } = await context.params
    const admin = await getSupabaseAdmin()

    const { data: session } = await admin
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single()

    if (!session) {
      return NextResponse.json({ messages: [] }, { status: 404 })
    }

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