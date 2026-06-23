// export const dynamic = "force-dynamic"
// import { NextResponse } from "next/server"
// import { getUser } from "@/lib/auth-server"
// import { getSupabaseAdmin } from "@/lib/supabase-server"

// export async function GET() {
//   try {
//     const user = await getUser()
//     if (!user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }

//     const admin = await getSupabaseAdmin()

//     // Fetch recent AI chat usage logs, grouped by day as "sessions"
//     const { data: logs } = await admin
//       .from("usage_logs")
//       .select("id, action, metadata, created_at")
//       .eq("user_id", user.id)
//       .eq("feature", "ai_chat")
//       .order("created_at", { ascending: false })
//       .limit(50)

//     if (!logs || logs.length === 0) {
//       return NextResponse.json({ sessions: [] })
//     }

//     // Group logs by day to form "chat sessions"
//     const grouped: Record<string, typeof logs> = {}
//     for (const log of logs) {
//       const day = new Date(log.created_at).toISOString().split("T")[0]
//       if (!grouped[day]) grouped[day] = []
//       grouped[day].push(log)
//     }

//     const sessions = Object.entries(grouped)
//       .slice(0, 10)
//       .map(([day, dayLogs], index) => {
//         const date = new Date(day)
//         const now = new Date()
//         const diffMs = now.getTime() - date.getTime()
//         const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

//         let time: string
//         if (diffDays === 0) time = "Today"
//         else if (diffDays === 1) time = "Yesterday"
//         else time = `${diffDays} days ago`

//         // Try to get a topic from metadata, otherwise use a generic title
//         const firstMeta = dayLogs[0]?.metadata as Record<string, unknown> | null
//         const title = firstMeta?.topic
//           ? String(firstMeta.topic)
//           : `Study Session ${index + 1}`

//         return {
//           id: `session-${day}`,
//           title,
//           time,
//           messages: dayLogs.length,
//         }
//       })

//     return NextResponse.json({ sessions })
//   } catch (err) {
//     console.error("[user/chat-history] Error:", err)
//     return NextResponse.json({ sessions: [] })
//   }
// }
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getSupabaseAdmin } from "@/lib/supabase-server"

function formatTimeLabel(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    return `Today · ${timeStr}`
  }
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

export async function GET() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ sessions: [] })

    const admin = await getSupabaseAdmin()

    const { data: sessions, error } = await admin
      .from("chat_sessions")
      .select("id, title, topic, updated_at, last_message_at")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false })

    if (error) {
      console.error("[user/chat-history] Error:", error)
      return NextResponse.json({ sessions: [] })
    }

    const sessionIds = (sessions || []).map((s) => s.id)
    let counts: Record<string, number> = {}

    if (sessionIds.length > 0) {
      const { data: messages } = await admin
        .from("chat_messages")
        .select("session_id")
        .in("session_id", sessionIds)

      counts = (messages || []).reduce((acc: Record<string, number>, item) => {
        acc[item.session_id] = (acc[item.session_id] || 0) + 1
        return acc
      }, {})
    }

    return NextResponse.json({
      sessions: (sessions || []).map((session) => ({
        id: session.id,
        title: session.title || session.topic || "New Chat",
        time: formatTimeLabel(session.last_message_at || session.updated_at),
        messages: counts[session.id] || 0,
      })),
    })
  } catch (err) {
    console.error("[user/chat-history] Error:", err)
    return NextResponse.json({ sessions: [] })
  }
}