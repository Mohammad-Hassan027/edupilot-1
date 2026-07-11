import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-server";
import { updateGoal, deleteGoal } from "@/lib/goals-db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateGoalSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  goal_type: z.enum(["daily", "weekly", "monthly"]).optional(),
  target_value: z.number().int().min(1).optional(),
  current_value: z.number().int().min(0).optional(),
  status: z.enum(["pending", "completed"]).optional(),
  due_date: z.string().datetime().nullable().optional(),
});

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const result = updateGoalSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const updateResult = await updateGoal(user.id, id, result.data);

    return NextResponse.json({
      success: true,
      data: updateResult.goal,
      xpAwarded: updateResult.xpAwarded,
      achievementsUnlocked: updateResult.achievementsUnlocked,
    });
  } catch (err) {
    console.error("[api/goals/[id]] PATCH Error:", err);
    const msg = err instanceof Error ? err.message : "Failed to update goal";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    await deleteGoal(user.id, id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/goals/[id]] DELETE Error:", err);
    const msg = err instanceof Error ? err.message : "Failed to delete goal";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
