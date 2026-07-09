export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import {
  getSavedStudyPlans,
  saveStudyPlan,
  logUsage,
  getSubscription,
  isTrialActive,
} from "@/lib/database"
import { awardXp, checkAndUnlockAchievements, XP_VALUES } from "@/lib/goals-db"

type PlannerTaskInput = {
  id: string
  title: string
  time: string
  duration: string
  subject: string
  completed: boolean
  day: number
}

export async function GET() {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ plans: [] })
    }

    const plans = await getSavedStudyPlans(user.id, 12)
    return NextResponse.json({ plans })
  } catch (err) {
    console.error("[ai/planner][GET] Error:", err)
    const message = err instanceof Error ? err.message : "Failed to load planner history"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        {
          error: "Login required to save planner.",
          code: "UNAUTHORIZED",
          requiresLogin: true,
        },
        { status: 401 }
      )
    }

    const subscription = await getSubscription(user.id)
    const paidTrialActive = await isTrialActive(user.id)
    const canUsePlanner = Boolean(
      subscription?.plan_id === "premium" &&
      (paidTrialActive || subscription?.status === "active" || subscription?.status === "trial")
    )

    if (!canUsePlanner) {
      return NextResponse.json(
        {
          error: "Planner is available on the Premium plan only.",
          code: "PLAN_REQUIRED",
          requiresUpgrade: true,
        },
        { status: 402 }
      )
    }

    const body = await req.json()

    const planId = typeof body?.planId === "string" ? body.planId : null
    const title =
      typeof body?.title === "string" && body.title.trim()
        ? body.title.trim()
        : "Study Plan"

    const goal =
      typeof body?.goal === "string" && body.goal.trim()
        ? body.goal.trim()
        : null

    const selectedDay = Number(body?.selectedDay) || 1
    const tasks = Array.isArray(body?.tasks) ? body.tasks : []

    const normalizedTasks: PlannerTaskInput[] = tasks.map((task: PlannerTaskInput, index: number) => ({
      id: String(task?.id || `${Date.now()}-${index}`),
      title: String(task?.title || `Task ${index + 1}`),
      time: String(task?.time || ""),
      duration: String(task?.duration || "1h"),
      subject: String(task?.subject || "General"),
      completed: Boolean(task?.completed),
      day: Number(task?.day) || selectedDay,
    }))

    const savedPlan = await saveStudyPlan(user.id, {
      planId,
      title,
      goal,
      selectedDay,
      tasks: normalizedTasks,
    })

    await logUsage(user.id, "study_plan", "planner_saved", {
      planId: savedPlan.id,
      title,
      taskCount: normalizedTasks.length,
    }).catch(() => undefined)

    // Award XP for study plan saved and check achievements
    awardXp(user.id, XP_VALUES.study_plan).catch((err) => {
      console.error("[ai/planner] Failed to award XP:", err);
    });
    checkAndUnlockAchievements(user.id).catch((err) => {
      console.error("[ai/planner] Failed to check achievements:", err);
    });

    return NextResponse.json({
      success: true,
      plan: savedPlan,
    })
  } catch (err) {
    console.error("[ai/planner][POST] Error:", err)
    const message = err instanceof Error ? err.message : "Failed to save planner"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}