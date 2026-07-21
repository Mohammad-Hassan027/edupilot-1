import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { getRevisions, createRevision } from "@/lib/revision-db"
import { z } from "zod"

export const dynamic = "force-dynamic"

const createRevisionSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  subject: z.string().min(1, "Subject is required"),
  study_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Study date must be YYYY-MM-DD"),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Scheduled date must be YYYY-MM-DD"),
  revision_stage: z.number().int().min(1).max(5).default(1),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  estimated_minutes: z.number().int().min(5).max(180).default(20),
  notes: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await getRevisions(user.id)
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error("[api/revision] GET Error:", err)
    const msg = err instanceof Error ? err.message : "Failed to load revisions"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const result = createRevisionSchema.safeParse(body)

    if (!result.success) {
      const errorMsg = result.error.errors.map((e) => e.message).join(", ")
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }

    const revision = await createRevision(user.id, result.data)
    return NextResponse.json({ success: true, data: revision })
  } catch (err) {
    console.error("[api/revision] POST Error:", err)
    const msg = err instanceof Error ? err.message : "Failed to create revision"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
