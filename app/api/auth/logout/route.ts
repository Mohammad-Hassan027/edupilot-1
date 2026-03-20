export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase-server"

export async function POST() {
  try {
    const supabase = await getSupabaseServer()
    await supabase.auth.signOut()

    const response = NextResponse.json({ success: true })

    // Explicitly clear all auth cookies so the browser session is fully ended
    const cookiesToClear = [
      "sb-access-token",
      "sb-refresh-token",
      `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0]}-auth-token`,
    ]
    for (const name of cookiesToClear) {
      response.cookies.set(name, "", { maxAge: 0, path: "/" })
    }

    return response
  } catch (err) {
    console.error("[logout]", err)
    // Even on error, return success so client redirects away
    return NextResponse.json({ success: true })
  }
}
