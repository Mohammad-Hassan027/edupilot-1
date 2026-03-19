import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getProfile, upsertProfile, getCredits, getSubscription } from "@/lib/database"

export async function GET() {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [profile, credits, subscription] = await Promise.all([
    getProfile(user.id),
    getCredits(user.id),
    getSubscription(user.id),
  ])

  return NextResponse.json({
    success: true,
    data: { profile, credits, subscription, email: user.email },
  })
}

export async function PATCH(req: NextRequest) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const allowed = ["full_name", "bio", "avatar_url"]
  const updates: Record<string, string> = {}

  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const profile = await upsertProfile(user.id, updates)

  return NextResponse.json({ success: true, data: profile })
}
