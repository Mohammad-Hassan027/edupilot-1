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
//       .select("id, feature, action, metadata, created_at")
//       .eq("user_id", user.id)
//       .order("created_at", { ascending: false })
//       .limit(20)

//     return NextResponse.json({ activity: logs || [] })
//   } catch (err) {
//     console.error("[user/recent-activity]", err)
//     return NextResponse.json({ activity: [] })
//   }
// }
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getSupabaseAdmin } from "@/lib/supabase-server"

export async function GET() {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ activity: [] }, { status: 200 })
    }

    const admin = await getSupabaseAdmin()

    const { data: sessions, error } = await admin
      .from("chat_sessions")
      .select("id, topic, title, last_message_at")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("[user/recent-activity]", error)
      return NextResponse.json({ activity: [] })
    }

    const activity = (sessions || []).map((s) => ({
      id: s.id,
      feature: "ai_chat",
      action: "question_asked",
      metadata: {
        topic: s.topic || s.title || "New Chat",
      },
      created_at: s.last_message_at,
    }))

    return NextResponse.json({ activity })
  } catch (err) {
    console.error("[user/recent-activity]", err)
    return NextResponse.json({ activity: [] })
  }
}