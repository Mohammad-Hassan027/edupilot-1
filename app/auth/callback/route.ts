import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"
import { getProfile, createProfile, createCredits, createSubscription } from "@/lib/database"

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=oauth_${error}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const supabase = getSupabaseServer()
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=session_exchange_failed`)
  }

  const user = data.user

  // Provision SaaS records if first-time Google login
  const existingProfile = await getProfile(user.id)
  if (!existingProfile) {
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "User"

    await Promise.all([
      createProfile(user.id, user.email!, fullName),
      createCredits(user.id),
      createSubscription(user.id),
    ])
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
