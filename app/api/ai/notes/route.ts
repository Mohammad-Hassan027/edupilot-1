export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/auth-server"
import {
  analyzeAttachmentsWithGemini,
  searchWithTavily,
  summarizeAttachments,
  type UploadedAttachment,
} from "@/lib/ai-tools"
import { getSavedNotes, saveGeneratedNote } from "@/lib/database"

type SourceMode = "pdf" | "video" | "spreadsheet"
type NoteType = "summary" | "concepts" | "bullets" | "revision"

type NoteTab = {
  type: NoteType
  title: string
  content: string
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function getGeminiKey() {
  const key = process.env.GEMINI_API_KEY?.trim()
  if (!key) throw new Error("GEMINI_API_KEY is not set")
  return key
}

async function callGeminiJson(prompt: string) {
  const key = getGeminiKey()

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error?.message || "Failed to generate notes with Gemini")
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part?.text || "")
      .join("\n")
      .trim() || ""

  if (!text) throw new Error("Gemini returned an empty response")

  const cleaned = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim()
  return JSON.parse(cleaned)
}

function extractYouTubeId(url: string) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace(/^\/+/, "")
    }
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v") || ""
    }
    return ""
  } catch {
    return ""
  }
}

function buildVideoSearchQuery(videoUrl: string) {
  const youtubeId = extractYouTubeId(videoUrl)
  if (youtubeId) {
    return `${videoUrl} ${youtubeId} lecture tutorial concepts summary notes`
  }
  return `${videoUrl} summary concepts notes`
}

async function generateStructuredNotes(params: {
  sourceMode: SourceMode
  sourceLabel: string
  sourceHint: string
  studyMaterial: string
}) {
  const prompt = `
You are EduPilot, an AI study notes assistant.

Create professional student notes from the material below.

Source type: ${params.sourceMode}
Source label: ${params.sourceLabel}
Source hint: ${params.sourceHint || "N/A"}

Study material:
${params.studyMaterial}

Return ONLY valid JSON in this exact shape:
{
  "title": "Short title",
  "sourceHint": "One short line about the source",
  "tabs": [
    { "type": "summary", "title": "Summary", "content": "clean markdown content" },
    { "type": "concepts", "title": "Concept Breakdown", "content": "clean markdown content" },
    { "type": "bullets", "title": "Bullet Points", "content": "clean markdown content" },
    { "type": "revision", "title": "Revision Notes", "content": "clean markdown content" }
  ]
}

Rules:
- Do not wrap JSON in markdown fences
- Generate all 4 tabs every time
- Do not start content with raw labels like ## Summary or ## Bullet Points
- Use clean headings only where useful
- Use divider lines with ---
- Use short paragraphs
- Make the content professional, readable, and student-friendly
- In Concept Breakdown, use clear sub-sections
- In Bullet Points, make the content concise and exam-friendly
- In Revision Notes, include quick review notes and 3 to 5 practice questions
`.trim()

  const parsed = (await callGeminiJson(prompt)) as {
    title?: string
    sourceHint?: string
    tabs?: Array<{ type?: string; title?: string; content?: string }>
  }

  const fallbackTitles: Record<NoteType, string> = {
    summary: "Summary",
    concepts: "Concept Breakdown",
    bullets: "Bullet Points",
    revision: "Revision Notes",
  }

  const requiredTypes: NoteType[] = ["summary", "concepts", "bullets", "revision"]

  const tabs: NoteTab[] = requiredTypes.map((type) => {
    const match = parsed.tabs?.find((tab) => tab.type === type)
    return {
      type,
      title: cleanText(match?.title) || fallbackTitles[type],
      content: cleanText(match?.content) || "No content generated for this section.",
    }
  })

  return {
    title: cleanText(parsed.title) || `${params.sourceLabel} Notes`,
    sourceHint: cleanText(parsed.sourceHint) || params.sourceHint,
    tabs,
  }
}

export async function GET() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ notes: [] })

    const notes = await getSavedNotes(user.id, 12)
    return NextResponse.json({ notes })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load notes history"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const sourceMode = body?.sourceMode as SourceMode
    const videoUrl = cleanText(body?.videoUrl)
    const files = (Array.isArray(body?.files) ? body.files : []) as UploadedAttachment[]

    if (!["pdf", "video", "spreadsheet"].includes(sourceMode)) {
      return NextResponse.json({ error: "Invalid source mode." }, { status: 400 })
    }

    if (sourceMode === "video") {
      try {
        new URL(videoUrl)
      } catch {
        return NextResponse.json({ error: "Please enter a valid video URL." }, { status: 400 })
      }
    } else {
      if (!files.length) {
        return NextResponse.json(
          { error: `Please upload a ${sourceMode === "pdf" ? "PDF" : "spreadsheet"} first.` },
          { status: 400 }
        )
      }
    }

    let studyMaterial = ""
    let sourceTitle = ""
    let sourceHint = ""

    if (sourceMode === "video") {
      const results = await searchWithTavily(buildVideoSearchQuery(videoUrl)).catch(() => [])
      const publicContext = results.length
        ? results
            .map(
              (item, index) =>
                `${index + 1}. ${item.title}\nSource: ${item.source}\nURL: ${item.url}\n${item.content}`
            )
            .join("\n\n")
        : `Public video URL: ${videoUrl}`

      studyMaterial = `Video URL:\n${videoUrl}\n\nPublic context:\n${publicContext}`
      sourceTitle = "Video Study Notes"
      sourceHint = videoUrl
    } else {
      const filesSummary = summarizeAttachments(files)

      const analysis = await analyzeAttachmentsWithGemini({
        message: `Generate complete study notes from these uploaded ${sourceMode === "pdf" ? "PDF" : "spreadsheet"} files.`,
        attachments: files,
      })

      studyMaterial = `Uploaded files:\n${filesSummary}\n\nAI file analysis:\n${analysis}`
      sourceTitle = files[0]?.name || `${sourceMode === "pdf" ? "PDF" : "Spreadsheet"} Notes`
      sourceHint = filesSummary
    }

    const generated = await generateStructuredNotes({
      sourceMode,
      sourceLabel: sourceMode === "pdf" ? "PDF" : sourceMode === "spreadsheet" ? "Spreadsheet" : "Video Link",
      sourceHint,
      studyMaterial,
    })

    const user = await getUser()
    if (user) {
      await saveGeneratedNote(user.id, {
        sourceType: sourceMode,
        sourceTitle: generated.title || sourceTitle,
        sourceLabel: sourceMode === "pdf" ? "PDF" : sourceMode === "spreadsheet" ? "Spreadsheet" : "Video Link",
        sourceHint: generated.sourceHint || sourceHint,
        tabs: generated.tabs,
      }).catch(() => null)
    }

    return NextResponse.json({
      success: true,
      title: generated.title || sourceTitle,
      sourceHint: generated.sourceHint || sourceHint,
      tabs: generated.tabs,
    })
  } catch (error) {
    console.error("[ai/notes] Error:", error)
    const message = error instanceof Error ? error.message : "Failed to generate notes"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}