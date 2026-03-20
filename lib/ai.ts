const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`

async function callGemini(prompt: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set. Please add it to your environment variables.")
  }

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("Empty response from Gemini")
  return text
}

// ── AI Tutor / Chat ──────────────────────────────────────────────────────────

export async function generateAIResponse(message: string): Promise<string> {
  const prompt = `You are EduPilot, an intelligent AI tutor and study assistant.
Help students learn effectively. Be clear, educational, and encouraging.
Format your answers with clear sections when needed. Answer step-by-step when explaining concepts.

Student question: ${message}

Answer:`
  return callGemini(prompt)
}

// ── Quiz ─────────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  question: string
  options: string[]
  answer: string
  explanation: string
}

export async function generateQuiz(topic: string, count = 5): Promise<QuizQuestion[]> {
  const prompt = `Generate exactly ${count} multiple-choice quiz questions about: "${topic}"

Return ONLY a valid JSON array. No markdown, no backticks, no explanation before or after:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A",
    "explanation": "Brief explanation of why this answer is correct."
  }
]

Requirements:
- Each question must have exactly 4 options
- The "answer" value must be the EXACT text of one of the options
- Questions must be accurate and educational
- Vary difficulty levels`

  const raw = await callGemini(prompt)
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()

  try {
    const parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed)) throw new Error("Response is not an array")
    return parsed.slice(0, count).map((q: QuizQuestion) => ({
      question: String(q.question || "Question"),
      options: Array.isArray(q.options) && q.options.length >= 2
        ? q.options.slice(0, 4).map(String)
        : ["True", "False", "Maybe", "None of the above"],
      answer: String(q.answer || q.options?.[0] || ""),
      explanation: String(q.explanation || ""),
    }))
  } catch {
    throw new Error("AI returned invalid quiz format. Please try again.")
  }
}

// ── Flashcards ───────────────────────────────────────────────────────────────

export interface Flashcard {
  front: string
  back: string
}

export async function generateFlashcards(topic: string, count = 5): Promise<Flashcard[]> {
  const prompt = `Create exactly ${count} educational flashcards about: "${topic}"

Return ONLY a valid JSON array. No markdown, no backticks, no explanation:
[
  {
    "front": "Question or key term",
    "back": "Clear, concise answer or definition"
  }
]

Requirements:
- Cover the most important concepts
- Keep fronts as questions or key terms
- Keep backs as concise, memorable answers`

  const raw = await callGemini(prompt)
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()

  try {
    const parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed)) throw new Error("Response is not an array")
    return parsed.slice(0, count).map((f: Flashcard) => ({
      front: String(f.front || "Front"),
      back: String(f.back || "Back"),
    }))
  } catch {
    throw new Error("AI returned invalid flashcard format. Please try again.")
  }
}

// ── Study Plan ───────────────────────────────────────────────────────────────

export async function generateStudyPlan(subject: string, duration: string, goal: string): Promise<string> {
  const prompt = `Create a detailed, structured study plan:
Subject: ${subject}
Duration: ${duration}
Goal: ${goal}

Include: weekly schedule, key topics to cover, study methods, resources, milestones, and success tips.
Format clearly with headings and bullet points.`
  return callGemini(prompt)
}
