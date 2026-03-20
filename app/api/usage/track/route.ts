export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { logUsage } from "@/lib/database"

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { feature, action, metadata } = await req.json()
    if (!feature || !action) {
      return NextResponse.json({ error: "feature and action are required" }, { status: 400 })
    }

    await logUsage(user.id, feature, action, metadata ?? {})
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[usage/track]", err)
    return NextResponse.json({ error: "Failed to track usage" }, { status: 500 })
  }
}
