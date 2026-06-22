export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import { generateConceptMap } from "@/lib/ai"
import {
  logUsage,
  getSavedConceptMaps,
  saveConceptMap,
  resolveStudySourceContent,
  type StudySourceType,
} from "@/lib/database"

export async function GET() {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ maps: [] })
    }

    const maps = await getSavedConceptMaps(user.id, 12)
    return NextResponse.json({ maps })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load concept map history"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Login required to generate a concept map.", code: "UNAUTHORIZED", requiresLogin: true },
        { status: 401 }
      )
    }

    const { sourceType, sourceId } = await req.json()

    if (sourceType !== "note" && sourceType !== "chat") {
      return NextResponse.json({ error: "sourceType must be 'note' or 'chat'" }, { status: 400 })
    }

    if (!sourceId || typeof sourceId !== "string") {
      return NextResponse.json({ error: "sourceId is required" }, { status: 400 })
    }

    const source = await resolveStudySourceContent(user.id, sourceType as StudySourceType, sourceId)

    if (!source) {
      return NextResponse.json({ error: "Could not find the selected note or chat session" }, { status: 404 })
    }

    const graph = await generateConceptMap(source.title, source.content)

    const savedMap = await saveConceptMap(user.id, {
      title: source.title,
      sourceType: sourceType as StudySourceType,
      sourceId,
      nodes: graph.nodes,
      edges: graph.edges.map((edge, index) => ({
        id: `e${index}`,
        source: edge.source,
        target: edge.target,
        label: edge.label,
      })),
    })

    await logUsage(user.id, "concept_map", "concept_map_generated", {
      title: source.title,
      sourceType,
      sourceId,
      nodeCount: graph.nodes.length,
      savedMapId: savedMap.id,
    }).catch(console.error)

    return NextResponse.json({ success: true, savedMap })
  } catch (err) {
    console.error("[ai/concept-map] Error:", err)
    const message = err instanceof Error ? err.message : "Failed to generate concept map"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
