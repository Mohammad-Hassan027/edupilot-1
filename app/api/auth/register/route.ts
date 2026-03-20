export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"
import { mapAuthError, getPasswordErrors } from "@/lib/auth"
import { createProfile, createCredits, createSubscription } from "@/lib/database"

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const pwErrors = getPasswordErrors(password)
    if (pwErrors.length > 0) {
      return NextResponse.json(
        { error: `Password requirements: ${pwErrors.join(", ")}` },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServer()   // ← was missing await

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: full_name || email.split("@")[0] },
      },
    })

    if (error) {
      return NextResponse.json({ error: mapAuthError(error.message) }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 })
    }

    if (data.user.identities?.length === 0) {
      return NextResponse.json({ error: "Account already exists. Please login." }, { status: 409 })
    }

    // Provision SaaS records
    await Promise.allSettled([
      createProfile(data.user.id, email, full_name || email.split("@")[0]),
      createCredits(data.user.id),
      createSubscription(data.user.id),
    ])

    return NextResponse.json({
      success: true,
      user: { id: data.user.id, email: data.user.email },
      message: "Registration successful! Please check your email to verify your account.",
    })
  } catch (err) {
    console.error("[register] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
