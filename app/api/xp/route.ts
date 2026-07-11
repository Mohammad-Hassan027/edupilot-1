import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth-server";
import { getUserXp } from "@/lib/goals-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const xp = await getUserXp(user.id);
    return NextResponse.json({ success: true, data: xp });
  } catch (err) {
    console.error("[api/xp] GET Error:", err);
    const msg = err instanceof Error ? err.message : "Failed to load XP";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
