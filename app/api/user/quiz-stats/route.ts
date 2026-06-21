export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getQuizTopicStats } from "@/lib/database"

export async function GET() {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ stats: [] })
    }

    const stats = await getQuizTopicStats(user.id)
    return NextResponse.json({ stats })
  } catch (err) {
    console.error("[user/quiz-stats] Error:", err)
    return NextResponse.json({ stats: [] })
  }
}
