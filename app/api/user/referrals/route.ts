export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { getUser as getCurrentUser } from "@/lib/auth-server"
import { getReferralStats } from "@/lib/database"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const stats = await getReferralStats(user.id)

    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error("[user/referrals][GET]", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load referral stats",
      },
      { status: 500 }
    )
  }
}
