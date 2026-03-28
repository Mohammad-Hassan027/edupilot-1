// export const dynamic = "force-dynamic"
// import { NextResponse } from "next/server"
// import { getUser } from "@/lib/auth-server"
// import { getSupabaseAdmin } from "@/lib/supabase-server"

// export async function DELETE() {
//   try {
//     const user = await getUser()
//     if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

//     const admin = await getSupabaseAdmin()
//     const { error } = await admin.auth.admin.deleteUser(user.id)

//     if (error) {
//       return NextResponse.json({ error: error.message }, { status: 500 })
//     }

//     return NextResponse.json({ success: true })
//   } catch (err) {
//     console.error("[delete-account]", err)
//     return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
//   }
// }
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getSupabaseAdmin, getSupabaseServer } from "@/lib/supabase-server"

export async function DELETE() {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = await getSupabaseAdmin()
    const supabase = await getSupabaseServer()

    const tablesToClean = [
      "chat_messages",
      "chat_sessions",
      "saved_notes",
      "saved_flashcard_sets",
      "saved_voice_history",
      "saved_quiz_attempts",
      "saved_study_plans",
      "usage_logs",
      "user_activity_sessions",
      "payments",
      "subscriptions",
      "credits",
      "profiles",
    ]

    for (const table of tablesToClean) {
      const { error } = await admin.from(table).delete().eq("user_id", user.id)

      if (error) {
        const message = error.message?.toLowerCase() || ""
        const safeToIgnore =
          message.includes("does not exist") ||
          message.includes("relation") ||
          message.includes("schema cache") ||
          message.includes("column")

        if (!safeToIgnore) {
          console.error(`[delete-account] failed cleaning ${table}:`, error.message)
          return NextResponse.json(
            { error: `Failed to delete account data from ${table}.` },
            { status: 500 }
          )
        }
      }
    }

    const { error: authDeleteError } = await admin.auth.admin.deleteUser(user.id)

    if (authDeleteError) {
      return NextResponse.json(
        { error: authDeleteError.message },
        { status: 500 }
      )
    }

    await supabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[delete-account]", err)
    return NextResponse.json(
      { error: "Failed to delete account." },
      { status: 500 }
    )
  }
}