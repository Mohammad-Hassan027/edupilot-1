export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import {
  activatePlanSubscription,
  createSubscription,
  getSubscription,
  refillCreditsForTrial,
} from "@/lib/database"

export async function POST(req: Request) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const planId = body?.planId

    if (planId !== "pro" && planId !== "premium") {
      return NextResponse.json({ success: false, error: "Invalid plan selected" }, { status: 400 })
    }

    const existingSubscription = await getSubscription(user.id)
    if (!existingSubscription) {
      await createSubscription(user.id).catch(() => {})
    }

    const subscription = await activatePlanSubscription(user.id, planId)
    await refillCreditsForTrial(user.id).catch(() => {})

    return NextResponse.json({
      success: true,
      message: `You are on ${planId === "premium" ? "Premium" : "Pro"}`,
      subscription,
    })
  } catch (error) {
    console.error("[activate-plan] Error:", error)
    const message = error instanceof Error ? error.message : "Failed to activate plan"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
