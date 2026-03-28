export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import {
  getProfile,
  upsertProfile,
  getCredits,
  getSubscription,
  createProfile,
  createCredits,
  createSubscription,
} from "@/lib/database"
import { getSupabaseAdmin } from "@/lib/supabase-server"

function getSafeDisplayName(user: Awaited<ReturnType<typeof getUser>>) {
  return (
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.name as string) ||
    user?.email?.split("@")[0] ||
    "User"
  )
}

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    let [profile, credits, subscription] = await Promise.all([
      getProfile(user.id),
      getCredits(user.id),
      getSubscription(user.id),
    ])

    if (!profile) {
      try {
        profile = await createProfile(user.id, user.email ?? "", getSafeDisplayName(user))
      } catch {
        profile = await getProfile(user.id)
      }
    }

    if (!credits) {
      try {
        credits = await createCredits(user.id)
      } catch {
        credits = await getCredits(user.id)
      }
    }

    if (!subscription) {
      try {
        subscription = await createSubscription(user.id)
      } catch {
        subscription = await getSubscription(user.id)
      }
    }

    if (profile && !profile.full_name) {
      try {
        profile = await upsertProfile(user.id, { full_name: getSafeDisplayName(user) })
      } catch {}
    }

    const authName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      null

    const response = NextResponse.json({
      success: true,
      data: { profile, credits, subscription, email: user.email, authName },
    })

    response.headers.set("Cache-Control", "no-store")
    return response
  } catch (error) {
    console.error("[api/user/profile][GET]", error)
    return NextResponse.json({ success: false, error: "Failed to load profile." }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const updates: Record<string, string | null> = {}

    if ("full_name" in body) {
      const fullName = typeof body.full_name === "string" ? body.full_name.trim().slice(0, 120) : ""
      if (!fullName) {
        return NextResponse.json({ success: false, error: "Full name is required." }, { status: 400 })
      }
      updates.full_name = fullName
    }

    if ("bio" in body) {
      updates.bio = typeof body.bio === "string" && body.bio.trim() ? body.bio.trim().slice(0, 300) : null
    }

    if ("avatar_url" in body) {
      const avatarUrl = body.avatar_url
      if (avatarUrl === null) {
        updates.avatar_url = null
      } else if (typeof avatarUrl === "string" && avatarUrl.length <= 2_000_000) {
        updates.avatar_url = avatarUrl
      } else {
        return NextResponse.json({ success: false, error: "Invalid profile image." }, { status: 400 })
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update." }, { status: 400 })
    }

    let profile = await getProfile(user.id)

    if (!profile) {
      profile = await createProfile(user.id, user.email ?? "", updates.full_name ?? getSafeDisplayName(user))
    }

    profile = await upsertProfile(user.id, updates)

    if (updates.full_name) {
      try {
        const admin = await getSupabaseAdmin()
        await admin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...user.user_metadata,
            full_name: updates.full_name,
            name: updates.full_name,
          },
        })
      } catch (metadataError) {
        console.error("[api/user/profile][PATCH][metadata-sync]", metadataError)
      }
    }

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    console.error("[api/user/profile][PATCH]", error)
    const message = error instanceof Error ? error.message : "Failed to save profile."
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
