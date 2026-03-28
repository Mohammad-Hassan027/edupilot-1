import { NextResponse } from "next/server"
import { getUser as getCurrentUser } from "@/lib/auth-server"
import {
  getProfile,
  createProfile,
  upsertProfile,
  getCredits,
  createCredits,
  getSubscription,
  createSubscription,
} from "@/lib/database"
import { getSupabaseAdmin } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    let profile = await getProfile(user.id)
    if (!profile) {
      profile = await createProfile(
        user.id,
        user.email ?? "",
        user.user_metadata?.full_name || user.user_metadata?.name || undefined
      )
    }

    let credits = await getCredits(user.id)
    if (!credits) {
      credits = await createCredits(user.id)
    }

    let subscription = await getSubscription(user.id)
    if (!subscription) {
      subscription = await createSubscription(user.id)
    }

    return NextResponse.json({
      success: true,
      data: {
        profile,
        credits,
        subscription,
        email: user.email ?? null,
        authName:
          profile?.full_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          null,
      },
    })
  } catch (error) {
    console.error("[user/profile][GET]", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load profile",
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const updates: Record<string, unknown> = {}

    if ("full_name" in body) {
      updates.full_name = typeof body.full_name === "string" ? body.full_name.trim() : null
    }

    if ("bio" in body) {
      updates.bio = typeof body.bio === "string" ? body.bio : null
    }

    if ("avatar_url" in body) {
      updates.avatar_url = body.avatar_url ? String(body.avatar_url) : null
    }

    const profile = await upsertProfile(user.id, updates)

    if ("full_name" in updates) {
      try {
        const admin = await getSupabaseAdmin()
        await admin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...user.user_metadata,
            full_name: updates.full_name ?? "",
            name: updates.full_name ?? "",
          },
        })
      } catch (metadataError) {
        console.error("[user/profile][PATCH][metadata-sync]", metadataError)
      }
    }

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    console.error("[user/profile][PATCH]", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update profile",
      },
      { status: 500 }
    )
  }
}
