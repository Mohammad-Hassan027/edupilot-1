import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-server";
import { checkAndUnlockAchievements, getUserXp } from "@/lib/goals-db";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const checkResult = await checkAndUnlockAchievements(user.id);
    const xp = await getUserXp(user.id);

    return NextResponse.json({
      success: true,
      achievementsUnlocked: checkResult.newlyUnlocked,
      xp,
    });
  } catch (err) {
    console.error("[api/achievements/check] POST Error:", err);
    const msg = err instanceof Error ? err.message : "Failed to check achievements";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
