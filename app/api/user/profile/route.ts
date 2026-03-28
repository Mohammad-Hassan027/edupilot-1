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

async function ensureProfile(user: any) {
  try {
    const existingProfile = await getProfile(user.id)
    if (existingProfile) {
      return existingProfile
    }
  } catch (error) {
    console.error("[user/profile][ensureProfile][getProfile]", error)
  }

  try {
    const createdProfile = await createProfile(
      user.id,
      user.email ?? "",
      user.user_metadata?.full_name || user.user_metadata?.name || undefined
    )

    if (createdProfile) {
      return createdProfile
    }
  } catch (error) {
    console.error("[user/profile][ensureProfile][createProfile]", error)
  }

  try {
    const retryProfile = await getProfile(user.id)
    if (retryProfile) {
      return retryProfile
    }
  } catch (error) {
    console.error("[user/profile][ensureProfile][retryGetProfile]", error)
  }

  return null
}

async function ensureCredits(userId: string) {
  try {
    const existingCredits = await getCredits(userId)
    if (existingCredits) {
      return existingCredits
    }
  } catch (error) {
    console.error("[user/profile][ensureCredits][getCredits]", error)
  }

  try {
    const createdCredits = await createCredits(userId)
    if (createdCredits) {
      return createdCredits
    }
  } catch (error) {
    console.error("[user/profile][ensureCredits][createCredits]", error)
  }

  try {
    const retryCredits = await getCredits(userId)
    if (retryCredits) {
      return retryCredits
    }
  } catch (error) {
    console.error("[user/profile][ensureCredits][retryGetCredits]", error)
  }

  return null
}

async function ensureSubscription(userId: string) {
  try {
    const existingSubscription = await getSubscription(userId)
    if (existingSubscription) {
      return existingSubscription
    }
  } catch (error) {
    console.error("[user/profile][ensureSubscription][getSubscription]", error)
  }

  try {
    const createdSubscription = await createSubscription(userId)
    if (createdSubscription) {
      return createdSubscription
    }
  } catch (error) {
    console.error("[user/profile][ensureSubscription][createSubscription]", error)
  }

  try {
    const retrySubscription = await getSubscription(userId)
    if (retrySubscription) {
      return retrySubscription
    }
  } catch (error) {
    console.error("[user/profile][ensureSubscription][retryGetSubscription]", error)
  }

  return null
}

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const profile = await ensureProfile(user)
    const credits = await ensureCredits(user.id)
    const subscription = await ensureSubscription(user.id)

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
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const updates: Record<string, unknown> = {}

    if ("full_name" in body) {
      updates.full_name =
        typeof body.full_name === "string" ? body.full_name.trim() : null
    }

    if ("bio" in body) {
      updates.bio = typeof body.bio === "string" ? body.bio : null
    }

    if ("avatar_url" in body) {
      updates.avatar_url = body.avatar_url ? String(body.avatar_url) : null
    }

    await ensureProfile(user)

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

    return NextResponse.json({
      success: true,
      data: profile,
    })
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