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

const NOTE_TYPES = ["summary", "concepts", "bullets", "revision"] as const

type SourceMode = "pdf" | "video" | "spreadsheet"
type PromptType = "summary" | "explanation" | "concepts" | "bullets" | "revision"
type NoteType = (typeof NOTE_TYPES)[number]

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
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set")
  }
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
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
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

  if (!text) {
    throw new Error("Gemini returned an empty response")
  }

  const cleaned = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    throw new Error("Gemini returned invalid notes format. Please try again.")
  }
}

function getSourceLabel(sourceMode: SourceMode) {
  if (sourceMode === "pdf") return "PDF"
  if (sourceMode === "spreadsheet") return "Spreadsheet"
  return "Video Link"
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

function buildVideoSearchQuery(videoUrl: string, promptType: PromptType) {
  const youtubeId = extractYouTubeId(videoUrl)

  if (youtubeId) {
    return `${videoUrl} ${youtubeId} ${promptType} lecture tutorial concepts summary notes`
  }

  return `${videoUrl} ${promptType} summary concepts notes`
}

async function generateStructuredNotes(params: {
  sourceMode: SourceMode
  promptType: PromptType
  sourceLabel: string
  sourceHint: string
  studyMaterial: string
}) {
  const promptFocusMap: Record<PromptType, string> = {
    summary: "Make the summary especially strong and concise.",
    explanation: "Make the explanation especially clear and simple for students.",
    concepts: "Make the concept breakdown especially detailed and well organized.",
    bullets: "Make the bullet points especially exam-friendly and quick to scan.",
    revision: "Make the revision notes especially useful for last-minute revision.",
  }

  const prompt = `
You are EduPilot, an AI study notes assistant.

Create polished notes for a student from the material below.

Source type: ${params.sourceMode}
Source label: ${params.sourceLabel}
Source hint: ${params.sourceHint || "N/A"}
Preferred focus: ${params.promptType}
${promptFocusMap[params.promptType]}

Study material:
${params.studyMaterial}

Return ONLY valid JSON in this exact shape:
{
  "title": "Short title",
  "sourceHint": "One short line about the source",
  "tabs": [
    { "type": "summary", "title": "Summary", "content": "markdown content" },
    { "type": "concepts", "title": "Concept Breakdown", "content": "markdown content" },
    { "type": "bullets", "title": "Bullet Points", "content": "markdown content" },
    { "type": "revision", "title": "Revision Notes", "content": "markdown content" }
  ]
}

Rules:
- Do not wrap JSON in markdown fences
- Keep the language student-friendly and professional
- Use clean markdown inside each content field
- Do not start sections with raw labels like "## Summary" or repeat the tab title
- Use short intro paragraphs, horizontal dividers (---), and clear H2/H3 subheadings where helpful
- Avoid cluttered symbols or unnecessary markdown noise
- The summary tab should be short and clear
- The concepts tab should explain key ideas with well-structured sub-sections
- The bullet points tab should be concise, scannable, and exam-friendly
- The revision tab should include quick review notes plus 3 to 5 practice questions
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

  const tabMap = new Map<NoteType, { title: string; content: string }>()

  for (const tab of parsed.tabs || []) {
    const type = tab?.type as NoteType | undefined
    if (!type || !NOTE_TYPES.includes(type)) continue

    tabMap.set(type, {
      title: cleanText(tab.title) || fallbackTitles[type],
      content: cleanText(tab.content) || "No content generated for this section.",
    })
  }

  const tabs: NoteTab[] = NOTE_TYPES.map((type) => ({
    type,
    title: tabMap.get(type)?.title || fallbackTitles[type],
    content: tabMap.get(type)?.content || "No content generated for this section.",
  }))

  return {
    title: cleanText(parsed.title) || `${params.sourceLabel} Notes`,
    sourceHint: cleanText(parsed.sourceHint) || params.sourceHint,
    tabs,
  }
}

export async function GET() {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ notes: [] })
    }

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
    const promptType = body?.promptType as PromptType
    const videoUrl = cleanText(body?.videoUrl)
    const files = (Array.isArray(body?.files) ? body.files : []) as UploadedAttachment[]

    if (!["pdf", "video", "spreadsheet"].includes(sourceMode)) {
      return NextResponse.json({ error: "Invalid source mode." }, { status: 400 })
    }

    if (!["summary", "explanation", "concepts", "bullets", "revision"].includes(promptType)) {
      return NextResponse.json({ error: "Invalid notes format selection." }, { status: 400 })
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
      const results = await searchWithTavily(buildVideoSearchQuery(videoUrl, promptType)).catch(() => [])

      const publicContext = results.length
        ? results
            .map(
              (item, index) =>
                `${index + 1}. ${item.title}\nSource: ${item.source}\nURL: ${item.url}\n${item.content}`
            )
            .join("\n\n")
        : `Public video URL: ${videoUrl}`

      studyMaterial = `
Video URL:
${videoUrl}

Public context:
${publicContext}
`.trim()

      sourceTitle = "Video Study Notes"
      sourceHint = videoUrl
    } else {
      const filesSummary = summarizeAttachments(files)

      const analysis = await analyzeAttachmentsWithGemini({
        message: `Generate ${promptType} study notes from these uploaded ${
          sourceMode === "pdf" ? "PDF" : "spreadsheet"
        } files.`,
        attachments: files,
      })

      studyMaterial = `
Uploaded files:
${filesSummary}

AI file analysis:
${analysis}
`.trim()

      sourceTitle = files[0]?.name || `${getSourceLabel(sourceMode)} Notes`
      sourceHint = filesSummary
    }

    const generated = await generateStructuredNotes({
      sourceMode,
      promptType,
      sourceLabel: getSourceLabel(sourceMode),
      sourceHint,
      studyMaterial,
    })

    const user = await getUser()

    if (user) {
      await saveGeneratedNote(user.id, {
        sourceType: sourceMode,
        sourceTitle: generated.title || sourceTitle,
        sourceLabel: getSourceLabel(sourceMode),
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