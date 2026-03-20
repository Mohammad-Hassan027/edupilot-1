export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getCredits } from "@/lib/database"
import { isTrialActive } from "@/lib/database"

export async function GET() {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [credits, trialActive] = await Promise.all([
    getCredits(user.id),
    isTrialActive(user.id),
  ])

  return NextResponse.json({
    success: true,
    data: { credits, trialActive },
  })
}
