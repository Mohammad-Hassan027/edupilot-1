import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-server";
import { getGoals, createGoal, checkAndUnlockAchievements } from "@/lib/goals-db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createGoalSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().max(500, "Description is too long").nullable().optional(),
  goal_type: z.enum(["daily", "weekly", "monthly"]),
  target_value: z.number().int().min(1, "Target value must be at least 1"),
  due_date: z.string().datetime().nullable().optional(),
});

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goals = await getGoals(user.id);
    return NextResponse.json({ success: true, data: goals });
  } catch (err) {
    console.error("[api/goals] GET Error:", err);
    const msg = err instanceof Error ? err.message : "Failed to load goals";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const result = createGoalSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const goal = await createGoal(user.id, result.data);
    
    // Check if goal creation triggered the "Goal Setter" achievement
    const sweepResult = await checkAndUnlockAchievements(user.id);

    return NextResponse.json({ 
      success: true, 
      data: goal,
      achievementsUnlocked: sweepResult.newlyUnlocked 
    });
  } catch (err) {
    console.error("[api/goals] POST Error:", err);
    const msg = err instanceof Error ? err.message : "Failed to create goal";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
