export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getProfile, upsertProfile, getCredits, getSubscription, createProfile, createCredits, createSubscription } from "@/lib/database"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get("user_id")

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user_id)
    .single()

  return NextResponse.json({
    plan: subscription?.plan_id || "free",
  })
}

export async function PATCH(req: NextRequest) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const allowed = ["full_name", "bio", "avatar_url"]
  const updates: Record<string, string | null> = {}

  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  }

  const profile = await upsertProfile(user.id, updates)
  return NextResponse.json({ success: true, data: profile })
}
