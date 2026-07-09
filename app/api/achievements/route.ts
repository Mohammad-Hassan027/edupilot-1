import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-server";
import { getAchievementsWithStatus } from "@/lib/goals-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const achievements = await getAchievementsWithStatus(user.id);
    return NextResponse.json({ success: true, data: achievements });
  } catch (err) {
    console.error("[api/achievements] GET Error:", err);
    const msg = err instanceof Error ? err.message : "Failed to load achievements";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
