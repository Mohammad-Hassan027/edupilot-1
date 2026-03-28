// // ── AI Backend: Groq (free, fast, no daily quota limits) ─────────────────────
// // Get your free API key at: https://console.groq.com
// // Set GROQ_API_KEY in Vercel environment variables

// async function callGroq(prompt: string): Promise<string> {
//   const key = process.env.GROQ_API_KEY
//   if (!key) {
//     throw new Error("GROQ_API_KEY is not set. Get a free key at console.groq.com and add it to Vercel environment variables.")
//   }

//   const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type":  "application/json",
//       "Authorization": `Bearer ${key}`,
//     },
//     body: JSON.stringify({
//       model:       "llama-3.3-70b-versatile",   // Free, very capable model on Groq
//       messages:    [{ role: "user", content: prompt }],
//       temperature: 0.7,
//       max_tokens:  2048,
//     }),
//   })

//   if (!res.ok) {
//     const err = await res.text()
//     throw new Error(`AI error ${res.status}: ${err}`)
//   }

//   const data = await res.json()
//   const text = data?.choices?.[0]?.message?.content
//   if (!text) throw new Error("Empty response from AI")
//   return text
// }

// // ── AI Tutor / Chat ──────────────────────────────────────────────────────────

// export interface GenerateAIResponseOptions {
//   mode?: "chat" | "web_search"
//   webContext?: string
//   attachmentContext?: string
// }

// export async function generateAIResponse(
//   message: string,
//   options: GenerateAIResponseOptions = {}
// ): Promise<string> {
//   const extraSections = [
//     options.mode === "web_search" && options.webContext
//       ? `Use these web search notes to answer accurately and cite the source names naturally when useful:
// ${options.webContext}`
//       : "",
//     options.attachmentContext
//       ? `The user uploaded these files:
// ${options.attachmentContext}
// Use them as context when relevant.`
//       : "",
//   ]
//     .filter(Boolean)
//     .join("\n\n")

//   const prompt = `You are EduPilot, an intelligent AI tutor and study assistant.
// Help students learn effectively. Be clear, educational, and encouraging.
// Format your answers with clear sections when needed. Answer step-by-step when explaining concepts.

// ${extraSections ? `${extraSections}\n\n` : ""}Student question: ${message}

// Answer:`

//   return callGroq(prompt)
// }

// // ── Quiz ─────────────────────────────────────────────────────────────────────

// export interface QuizQuestion {
//   question:    string
//   options:     string[]
//   answer:      string
//   explanation: string
// }

// export async function generateQuiz(topic: string, count = 5): Promise<QuizQuestion[]> {
//   const prompt = `Generate exactly ${count} multiple-choice quiz questions about: "${topic}"

// Return ONLY a valid JSON array. No markdown, no backticks, no explanation before or after:
// [
//   {
//     "question": "Question text here?",
//     "options": ["Option A", "Option B", "Option C", "Option D"],
//     "answer": "Option A",
//     "explanation": "Brief explanation of why this answer is correct."
//   }
// ]

// Requirements:
// - Each question must have exactly 4 options
// - The "answer" value must be the EXACT text of one of the options
// - Questions must be accurate and educational
// - Vary difficulty levels`

//   const raw     = await callGroq(prompt)
//   const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()

//   try {
//     const parsed = JSON.parse(cleaned)
//     if (!Array.isArray(parsed)) throw new Error("Response is not an array")
//     return parsed.slice(0, count).map((q: QuizQuestion) => ({
//       question:    String(q.question || "Question"),
//       options:     Array.isArray(q.options) && q.options.length >= 2
//         ? q.options.slice(0, 4).map(String)
//         : ["True", "False", "Maybe", "None of the above"],
//       answer:      String(q.answer || q.options?.[0] || ""),
//       explanation: String(q.explanation || ""),
//     }))
//   } catch {
//     throw new Error("AI returned invalid quiz format. Please try again.")
//   }
// }

// // ── Flashcards ───────────────────────────────────────────────────────────────

// export interface Flashcard {
//   front: string
//   back:  string
// }

// export async function generateFlashcards(topic: string, count = 5): Promise<Flashcard[]> {
//   const prompt = `Create exactly ${count} educational flashcards about: "${topic}"

// Return ONLY a valid JSON array. No markdown, no backticks, no explanation:
// [
//   {
//     "front": "Question or key term",
//     "back": "Clear, concise answer or definition"
//   }
// ]

// Requirements:
// - Cover the most important concepts
// - Keep fronts as questions or key terms
// - Keep backs as concise, memorable answers`

//   const raw     = await callGroq(prompt)
//   const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()

//   try {
//     const parsed = JSON.parse(cleaned)
//     if (!Array.isArray(parsed)) throw new Error("Response is not an array")
//     return parsed.slice(0, count).map((f: Flashcard) => ({
//       front: String(f.front || "Front"),
//       back:  String(f.back  || "Back"),
//     }))
//   } catch {
//     throw new Error("AI returned invalid flashcard format. Please try again.")
//   }
// }

// // ── Study Plan ───────────────────────────────────────────────────────────────

// export async function generateStudyPlan(subject: string, duration: string, goal: string): Promise<string> {
//   const prompt = `Create a detailed, structured study plan:
// Subject: ${subject}
// Duration: ${duration}
// Goal: ${goal}

// Include: weekly schedule, key topics to cover, study methods, resources, milestones, and success tips.
// Format clearly with headings and bullet points.`
//   return callGroq(prompt)
// }
import { GoogleGenerativeAI } from "@google/generative-ai"

// =========================
// Shared helpers
// =========================

function getGroqKey() {
  const key = process.env.GROQ_API_KEY?.trim()
  if (!key) {
    throw new Error("GROQ_API_KEY is not set")
  }
  return key
}

function getGeminiKey() {
  const key = process.env.GEMINI_API_KEY?.trim()
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set")
  }
  return key
}

function cleanJsonText(raw: string) {
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim()

  if (
    (cleaned.startsWith("[") && cleaned.endsWith("]")) ||
    (cleaned.startsWith("{") && cleaned.endsWith("}"))
  ) {
    return cleaned
  }

  const firstArray = cleaned.indexOf("[")
  const lastArray = cleaned.lastIndexOf("]")
  if (firstArray !== -1 && lastArray !== -1 && lastArray > firstArray) {
    return cleaned.slice(firstArray, lastArray + 1)
  }

  const firstObject = cleaned.indexOf("{")
  const lastObject = cleaned.lastIndexOf("}")
  if (firstObject !== -1 && lastObject !== -1 && lastObject > firstObject) {
    return cleaned.slice(firstObject, lastObject + 1)
  }

  return cleaned
}

async function callGroq(prompt: string): Promise<string> {
  const key = getGroqKey()

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are EduPilot AI. Follow the user's output format exactly. If asked for JSON, return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const message =
      (data as { error?: { message?: string } })?.error?.message ||
      JSON.stringify(data) ||
      "Groq request failed"
    throw new Error(message)
  }

  const text =
    (data as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message?.content?.trim() ||
    ""

  if (!text) {
    throw new Error("Empty response from Groq")
  }

  return text
}

async function callGemini(prompt: string): Promise<string> {
  const key = getGeminiKey()
  const client = new GoogleGenerativeAI(key)

  const modelNames = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"]

  let lastError = "Gemini failed"

  for (const modelName of modelNames) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      })

      const result = await model.generateContent(prompt)
      const text = result.response.text().trim()

      if (!text) {
        lastError = `Empty response from ${modelName}`
        continue
      }

      return text
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Gemini request failed"
    }
  }

  throw new Error(lastError)
}

async function callAIWithFallback(prompt: string): Promise<string> {
  const errors: string[] = []

  try {
    return await callGroq(prompt)
  } catch (error) {
    errors.push(`Groq: ${error instanceof Error ? error.message : "Unknown error"}`)
  }

  try {
    return await callGemini(prompt)
  } catch (error) {
    errors.push(`Gemini: ${error instanceof Error ? error.message : "Unknown error"}`)
  }

  throw new Error(errors.join(" | "))
}

// =========================
// AI Tutor / Chat
// =========================

export interface GenerateAIResponseOptions {
  mode?: "chat" | "web_search"
  webContext?: string
  attachmentContext?: string
}

export async function generateAIResponse(
  message: string,
  options: GenerateAIResponseOptions = {}
): Promise<string> {
  const extraSections = [
    options.mode === "web_search" && options.webContext
      ? `Use these web search notes to answer accurately and cite source names naturally when useful:
${options.webContext}`
      : "",
    options.attachmentContext
      ? `The user uploaded these files:
${options.attachmentContext}
Use them as context when relevant.`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n")

  const prompt = `You are EduPilot, an intelligent AI tutor and study assistant.
Help students learn effectively. Be clear, educational, and encouraging.
Format answers with clear sections where useful.

${extraSections ? `${extraSections}\n\n` : ""}Student question: ${message}

Answer:`

  return callAIWithFallback(prompt)
}

// =========================
// Quiz
// =========================

export interface QuizQuestion {
  question: string
  options: string[]
  answer: string
  explanation: string
}

function normalizeQuizItem(item: unknown, index: number): QuizQuestion {
  const raw = (item || {}) as {
    question?: unknown
    options?: unknown
    answer?: unknown
    explanation?: unknown
  }

  let options = Array.isArray(raw.options)
    ? raw.options.map((option) => String(option).trim()).filter(Boolean)
    : []

  if (options.length < 4) {
    options = [...options, "Option B", "Option C", "Option D"].slice(0, 4)
  } else {
    options = options.slice(0, 4)
  }

  let answer = String(raw.answer || "").trim()
  if (!answer || !options.some((option) => option.toLowerCase() === answer.toLowerCase())) {
    answer = options[0]
  }

  return {
    question: String(raw.question || `Question ${index + 1}`).trim(),
    options,
    answer,
    explanation: String(raw.explanation || "").trim(),
  }
}

export async function generateQuiz(topic: string, count = 5): Promise<QuizQuestion[]> {
  const prompt = `Generate exactly ${count} multiple-choice quiz questions about "${topic}".

Return ONLY valid JSON array in this exact structure:
[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A",
    "explanation": "Brief explanation"
  }
]

Rules:
- Return only JSON
- No markdown
- No backticks
- Exactly ${count} questions
- Exactly 4 options per question
- "answer" must exactly match one option
- Questions should be educational and accurate
- Keep explanations short`

  const raw = await callAIWithFallback(prompt)
  const cleaned = cleanJsonText(raw)

  try {
    const parsed = JSON.parse(cleaned)

    if (!Array.isArray(parsed)) {
      throw new Error("Quiz response is not an array")
    }

    const normalized = parsed.slice(0, count).map((item, index) => normalizeQuizItem(item, index))

    if (!normalized.length) {
      throw new Error("No quiz questions generated")
    }

    return normalized
  } catch (error) {
    console.error("[generateQuiz] Invalid AI JSON:", raw)
    throw new Error("AI returned invalid quiz format. Please try again.")
  }
}

// =========================
// Flashcards
// =========================

export interface Flashcard {
  front: string
  back: string
}

export async function generateFlashcards(topic: string, count = 5): Promise<Flashcard[]> {
  const prompt = `Create exactly ${count} educational flashcards about "${topic}".

Return ONLY valid JSON array:
[
  {
    "front": "Question or key term",
    "back": "Clear answer or definition"
  }
]

Rules:
- Return only JSON
- No markdown
- No backticks`

  const raw = await callAIWithFallback(prompt)
  const cleaned = cleanJsonText(raw)

  try {
    const parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed)) throw new Error("Response is not an array")

    return parsed.slice(0, count).map((item: { front?: unknown; back?: unknown }) => ({
      front: String(item.front || "Front"),
      back: String(item.back || "Back"),
    }))
  } catch {
    throw new Error("AI returned invalid flashcard format. Please try again.")
  }
}

// =========================
// Study Plan
// =========================

export async function generateStudyPlan(subject: string, duration: string, goal: string): Promise<string> {
  const prompt = `Create a detailed, structured study plan.

Subject: ${subject}
Duration: ${duration}
Goal: ${goal}

Include:
- weekly schedule
- key topics
- study methods
- resources
- milestones
- success tips

Format clearly with headings and bullet points.`

  return callAIWithFallback(prompt)
}