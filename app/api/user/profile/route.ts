export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getProfile, upsertProfile, getCredits, getSubscription, createProfile, createCredits, createSubscription } from "@/lib/database"

export async function GET() {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let [profile, credits, subscription] = await Promise.all([
    getProfile(user.id),
    getCredits(user.id),
    getSubscription(user.id),
  ])

  // Auto-provision missing records (handles Google OAuth users who skipped register)
  if (!profile) {
    const name =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email?.split("@")[0] ||
      "User"
    try { profile = await createProfile(user.id, user.email ?? "", name) } catch {}
  }
  if (!credits) {
    try { credits = await createCredits(user.id) } catch {}
  }
  if (!subscription) {
    try { subscription = await createSubscription(user.id) } catch {}
  }

  // If profile exists but full_name is null, back-fill from Google metadata
  if (profile && !profile.full_name) {
    const name =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email?.split("@")[0] ||
      "User"
    try {
      profile = await upsertProfile(user.id, { full_name: name })
    } catch {}
  }

  // authName gives the hook a name even when profile row is stale
  const authName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    null

  const response = NextResponse.json({
    success: true,
    data: { profile, credits, subscription, email: user.email, authName },
  })
  // Cache for 30 seconds to reduce DB hammering
  response.headers.set("Cache-Control", "no-store")
  return response
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
