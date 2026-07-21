import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getRevisionById, updateRevision, deleteRevision } from "@/lib/revision-db"
import { generateNextRevisionStage } from "@/lib/revision-scheduler-ai"
import { logUsage } from "@/lib/database"
import { z } from "zod"

export const dynamic = "force-dynamic"

const updateRevisionSchema = z.object({
  status: z.enum(["pending", "completed"]).optional(),
  notes: z.string().optional().nullable(),
})

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const body = await req.json().catch(() => ({}))
    const result = updateRevisionSchema.safeParse(body)

    if (!result.success) {
      const errorMsg = result.error.errors.map((e) => e.message).join(", ")
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }

    const existing = await getRevisionById(user.id, id)
    if (!existing) {
      return NextResponse.json({ error: "Revision task not found" }, { status: 404 })
    }

    const updates: Parameters<typeof updateRevision>[2] = { ...result.data }

    // If marking as completed, set completed_at timestamp
    if (result.data.status === "completed" && existing.status === "pending") {
      updates.completed_at = new Date().toISOString()
    }

    const updated = await updateRevision(user.id, id, updates)

    let nextRevision = null
    // If it was completed, schedule the next stage automatically
    if (result.data.status === "completed" && existing.status === "pending") {
      nextRevision = await generateNextRevisionStage(user.id, updated, new Date())
      
      // Track usage for stats and notifications dropdown
      await logUsage(user.id, "revision", "revision_completed", {
        topic: updated.topic,
        subject: updated.subject,
        stage: updated.revision_stage,
      })
    }

    return NextResponse.json({
      success: true,
      data: updated,
      nextRevision,
    })
  } catch (err) {
    console.error("[api/revision/[id]] PATCH Error:", err)
    const msg = err instanceof Error ? err.message : "Failed to update revision"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    await deleteRevision(user.id, id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[api/revision/[id]] DELETE Error:", err)
    const msg = err instanceof Error ? err.message : "Failed to delete revision"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
