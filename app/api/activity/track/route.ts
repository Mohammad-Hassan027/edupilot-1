export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getSupabaseAdmin } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sessionId, path, seconds, ended } = await req.json()

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
    }

    const trackedSeconds = Math.max(0, Math.floor(Number(seconds) || 0))
    const admin = await getSupabaseAdmin()

    const { data: existing, error: selectError } = await admin
      .from("user_activity_sessions")
      .select("id, duration_seconds")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (selectError) {
      throw new Error(selectError.message)
    }

    const now = new Date().toISOString()

    if (!existing) {
      const { error: insertError } = await admin.from("user_activity_sessions").insert({
        user_id: user.id,
        session_id: sessionId,
        path: typeof path === "string" ? path : "/dashboard",
        duration_seconds: trackedSeconds,
        started_at: now,
        last_seen_at: now,
        ended_at: ended ? now : null,
      })

      if (insertError) {
        throw new Error(insertError.message)
      }
    } else {
      const { error: updateError } = await admin
        .from("user_activity_sessions")
        .update({
          path: typeof path === "string" ? path : "/dashboard",
          duration_seconds: (existing.duration_seconds || 0) + trackedSeconds,
          last_seen_at: now,
          ended_at: ended ? now : null,
        })
        .eq("id", existing.id)

      if (updateError) {
        throw new Error(updateError.message)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[activity/track]", error)
    return NextResponse.json({ error: "Failed to track activity" }, { status: 500 })
  }
}
