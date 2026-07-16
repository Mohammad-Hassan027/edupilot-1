export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import {
  deleteSavedStudyPlan,
  getSavedStudyPlanById,
  setStudyPlanReminders,
} from "@/lib/database"

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ planId: string }> }
) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { planId } = await context.params
    const plan = await getSavedStudyPlanById(user.id, planId)

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    return NextResponse.json({ plan })
  } catch (err) {
    console.error("[ai/planner/:planId][GET] Error:", err)
    const message = err instanceof Error ? err.message : "Failed to load plan"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ planId: string }> }
) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { planId } = await context.params
    const body = await req.json().catch(() => ({}))

    if (typeof body?.remindersEnabled !== "boolean") {
      return NextResponse.json(
        { error: "remindersEnabled (boolean) is required" },
        { status: 400 }
      )
    }

    const plan = await setStudyPlanReminders(user.id, planId, body.remindersEnabled)

    return NextResponse.json({ success: true, plan })
  } catch (err) {
    console.error("[ai/planner/:planId][PATCH] Error:", err)
    const message = err instanceof Error ? err.message : "Failed to update reminders"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ planId: string }> }
) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { planId } = await context.params
    await deleteSavedStudyPlan(user.id, planId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[ai/planner/:planId][DELETE] Error:", err)
    const message = err instanceof Error ? err.message : "Failed to delete plan"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}