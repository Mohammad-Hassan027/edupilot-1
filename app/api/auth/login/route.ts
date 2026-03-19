import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"
import { mapAuthError } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const supabase = getSupabaseServer()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Differentiate "user not found" vs "wrong password"
      if (
        error.message.includes("Invalid login credentials") ||
        error.message.includes("User not found")
      ) {
        return NextResponse.json(
          { error: "Invalid email or password. Please try again." },
          { status: 401 }
        )
      }
      return NextResponse.json({ error: mapAuthError(error.message) }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    })
  } catch (err) {
    console.error("[login] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
