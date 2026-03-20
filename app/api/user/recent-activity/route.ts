export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getSupabaseAdmin } from "@/lib/supabase-server"

export async function GET() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const admin = await getSupabaseAdmin()

    const { data: logs } = await admin
      .from("usage_logs")
      .select("id, feature, action, metadata, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)

    return NextResponse.json({ activity: logs || [] })
  } catch (err) {
    console.error("[user/recent-activity]", err)
    return NextResponse.json({ activity: [] })
  }
}
