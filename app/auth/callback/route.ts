export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"
import { getProfile, createProfile, createCredits, createSubscription } from "@/lib/database"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await getSupabaseServer()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user) {
      const user = data.user

      // For Google OAuth: provision SaaS records if they don't exist yet
      const existing = await getProfile(user.id)
      if (!existing) {
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "User"

        await Promise.allSettled([
          createProfile(user.id, user.email ?? "", fullName),
          createCredits(user.id),
          createSubscription(user.id),
        ])
      }
    }
  }

  return NextResponse.redirect(new URL(next, req.url))
}
