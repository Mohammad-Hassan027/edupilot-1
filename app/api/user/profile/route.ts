import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getProfile, createProfile, upsertProfile } from "@/lib/database"
import { getSupabaseAdmin } from "@/lib/supabase-server"

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

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
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
      } catch {
        // keep profile saved even if auth metadata sync fails
      }
    }

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update profile",
      },
      { status: 500 }
    )
  }
}