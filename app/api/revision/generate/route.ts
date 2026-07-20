import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { generateRevisionsFromActivity } from "@/lib/revision-scheduler-ai"
import { logUsage } from "@/lib/database"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { generatedCount } = await generateRevisionsFromActivity(user.id)

    if (generatedCount > 0) {
      await logUsage(user.id, "revision", "revision_generated", {
        count: generatedCount,
      })
    }

    return NextResponse.json({
      success: true,
      generatedCount,
    })
  } catch (err) {
    console.error("[api/revision/generate] POST Error:", err)
    const msg = err instanceof Error ? err.message : "Failed to generate revisions"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
