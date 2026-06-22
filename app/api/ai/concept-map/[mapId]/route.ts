export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { deleteSavedConceptMap, getSavedConceptMapById } from "@/lib/database"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ mapId: string }> }
) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { mapId } = await params
    const map = await getSavedConceptMapById(user.id, mapId)

    if (!map) {
      return NextResponse.json({ error: "Concept map not found" }, { status: 404 })
    }

    return NextResponse.json({ map })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load concept map"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ mapId: string }> }
) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { mapId } = await params
    await deleteSavedConceptMap(user.id, mapId)

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete concept map"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
