export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { generateEduPilotGuideResponse } from "@/lib/ai"

type RelatedPage = {
  label: string
  href: string
}

const FALLBACK_SUGGESTIONS = [
  "How do I use AI Tutor?",
  "How do I create notes?",
  "How does Quiz work?",
  "How do I use Planner?",
]

function getRelevantPages(message: string): RelatedPage[] {
  const text = message.toLowerCase()
  const pages: RelatedPage[] = []

  const add = (label: string, href: string) => {
    if (!pages.some((page) => page.href === href)) {
      pages.push({ label, href })
    }
  }

  add("Dashboard", "/dashboard")

  if (text.includes("ai tutor") || text.includes("tutor") || text.includes("chat")) {
    add("AI Tutor", "/ai-tutor")
  }

  if (text.includes("notes") || text.includes("summary") || text.includes("pdf")) {
    add("Notes", "/notes")
  }

  if (text.includes("flashcard") || text.includes("flashcards")) {
    add("Flashcards", "/flashcards")
  }

  if (text.includes("voice") || text.includes("audio") || text.includes("speak")) {
    add("AI Voice", "/ai-voice")
  }

  if (text.includes("quiz") || text.includes("mcq") || text.includes("test")) {
    add("Quiz", "/quiz")
  }

  if (text.includes("planner") || text.includes("plan") || text.includes("schedule")) {
    add("Planner", "/planner")
  }

  if (text.includes("profile") || text.includes("account")) {
    add("Profile", "/profile")
  }

  if (text.includes("pricing") || text.includes("plan") || text.includes("premium") || text.includes("pro")) {
    add("Pricing", "/pricing")
  }

  if (text.includes("setting") || text.includes("settings")) {
    add("Settings", "/settings")
  }

  if (text.includes("help") || text.includes("support")) {
    add("Help Center", "/help-center")
  }

  if (pages.length === 1) {
    add("AI Tutor", "/ai-tutor")
    add("Notes", "/notes")
    add("Quiz", "/quiz")
  }

  return pages.slice(0, 4)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const message = typeof body?.message === "string" ? body.message.trim() : ""

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    if (message.length > 1000) {
      return NextResponse.json({ error: "Message is too long" }, { status: 400 })
    }

    const reply = await generateEduPilotGuideResponse(message)
    const relatedPages = getRelevantPages(message)

    return NextResponse.json({
      success: true,
      reply,
      suggestions: FALLBACK_SUGGESTIONS,
      relatedPages,
    })
  } catch (err) {
    console.error("[edupilot-assistant] Error:", err)

    return NextResponse.json({
      success: true,
      reply:
        "I can help only with EduPilot usage.\n\nStep 1: Ask about a feature like AI Tutor, Notes, Quiz, or Planner.\nStep 2: I will explain how to use it inside EduPilot.\nStep 3: Open the related page and try the steps.\n\nTry this next: Open the Dashboard to check your recent activity and available features.",
      suggestions: FALLBACK_SUGGESTIONS,
      relatedPages: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "AI Tutor", href: "/ai-tutor" },
        { label: "Notes", href: "/notes" },
        { label: "Quiz", href: "/quiz" },
      ],
    })
  }
}