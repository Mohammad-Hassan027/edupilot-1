export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"
import { getSupabaseAdmin } from "@/lib/supabase-server"
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

    // Use admin client to create user WITHOUT email confirmation
    const admin = await getSupabaseAdmin()
    const displayName = full_name?.trim() || email.split("@")[0]

    const { data: adminData, error: adminError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,          // ← skip email confirmation entirely
      user_metadata: { full_name: displayName },
    })

    if (adminError) {
      // Handle duplicate email
      if (adminError.message.includes("already") || adminError.message.includes("exists")) {
        return NextResponse.json({ error: "Account already exists. Please login." }, { status: 409 })
      }
      return NextResponse.json({ error: mapAuthError(adminError.message) }, { status: 400 })
    }

    if (!adminData.user) {
      return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 })
    }

    const userId = adminData.user.id

    // Provision SaaS records (profile, 20 free credits, free subscription)
    await Promise.allSettled([
      createProfile(userId, email, displayName),
      createCredits(userId),
      createSubscription(userId),
    ])

    // Now sign the user in automatically so they get a session cookie
    const supabase = await getSupabaseServer()
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError || !signInData.session) {
      // Registration succeeded but auto-login failed — that's OK, redirect to login
      return NextResponse.json({
        success: true,
        autoLogin: false,
        message: "Account created! Please log in.",
      })
    }

    return NextResponse.json({
      success: true,
      autoLogin: true,
      user: { id: userId, email },
      message: "Account created successfully!",
    })
  } catch (err) {
    console.error("[register] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
