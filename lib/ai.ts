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
export function cleanJsonText(raw: string) {
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

export async function callAIWithFallback(prompt: string): Promise<string> {
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

export type ExplainStyle = "simpler" | "analogy" | "step-by-step" | "real-world"

export const EXPLAIN_STYLE_LABELS: Record<ExplainStyle, string> = {
  simpler: "Simpler (ELI5)",
  analogy: "Use an analogy",
  "step-by-step": "Step-by-step",
  "real-world": "Real-world example",
}

const EXPLAIN_STYLE_INSTRUCTIONS: Record<ExplainStyle, string> = {
  simpler:
    "Explain it in the simplest possible terms, as if to someone with no background in the subject. Avoid jargon, use short sentences.",
  analogy:
    "Explain it using a clear, relatable analogy or metaphor that makes the concept easy to visualize and remember.",
  "step-by-step":
    "Break it down into clear, numbered steps that build up to the full explanation, one idea at a time.",
  "real-world":
    "Explain it using a concrete real-world example or practical scenario where this concept actually applies.",
}

export async function generateAlternateExplanation(
  question: string,
  previousAnswer: string,
  style: ExplainStyle
): Promise<string> {
  const prompt = `You are EduPilot, an AI tutor. A student asked the following question:
"${question}"

They already received this explanation but found it hard to understand:
"${previousAnswer}"

Re-explain the answer to the same question in a different way. ${EXPLAIN_STYLE_INSTRUCTIONS[style]}

Stay accurate and stay focused on the original question. Do not just repeat the previous explanation in different words — genuinely change the approach.`

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

export type QuizDifficulty = "easy" | "medium" | "hard"

const QUIZ_DIFFICULTY_GUIDANCE: Record<QuizDifficulty, string> = {
  easy: "Keep questions at a beginner level: basic recall and simple definitions.",
  medium: "Keep questions at an intermediate level: application of concepts, not just recall.",
  hard: "Keep questions at an advanced level: multi-step reasoning, edge cases, and nuanced distinctions.",
}

export async function generateQuiz(
  topic: string,
  count = 5,
  difficulty: QuizDifficulty = "medium"
): Promise<QuizQuestion[]> {
  const prompt = `Generate exactly ${count} multiple-choice quiz questions about "${topic}".

Difficulty: ${difficulty}. ${QUIZ_DIFFICULTY_GUIDANCE[difficulty]}

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

export async function generateQuizFromContent(
  title: string,
  content: string,
  count = 5,
  difficulty: QuizDifficulty = "medium"
): Promise<QuizQuestion[]> {
  const prompt = `Read the study material below (titled "${title}") and generate exactly ${count} multiple-choice quiz questions that test understanding of it.

Difficulty: ${difficulty}. ${QUIZ_DIFFICULTY_GUIDANCE[difficulty]}

Study material:
${content.slice(0, 12000)}

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
- Base every question strictly on the material above
- Return only JSON
- No markdown
- No backticks
- Exactly ${count} questions
- Exactly 4 options per question
- "answer" must exactly match one option
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
    console.error("[generateQuizFromContent] Invalid AI JSON:", raw)
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

export async function generateFlashcardsFromContent(content: string, count = 10): Promise<Flashcard[]> {
  const prompt = `Read the study material below and create exactly ${count} educational flashcards that test the key concepts, facts, and definitions found in it.

Study material:
${content.slice(0, 12000)}

Return ONLY valid JSON array:
[
  {
    "front": "Question or key term",
    "back": "Clear answer or definition"
  }
]

Rules:
- Base every flashcard strictly on the material above
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
// Concept Map
// =========================

export interface ConceptMapNode {
  id: string
  label: string
  excerpt: string
}

export interface ConceptMapEdge {
  source: string
  target: string
  label?: string
}

export interface ConceptMapGraph {
  nodes: ConceptMapNode[]
  edges: ConceptMapEdge[]
}

export async function generateConceptMap(title: string, content: string): Promise<ConceptMapGraph> {
  const prompt = `Read the study material below (titled "${title}") and extract the key concepts and how they relate to one another, as a concept map.

Study material:
${content.slice(0, 12000)}

Return ONLY valid JSON in this exact shape:
{
  "nodes": [
    { "id": "short-slug", "label": "Concept name", "excerpt": "1-2 sentence explanation of this concept, grounded in the material" }
  ],
  "edges": [
    { "source": "node-id", "target": "node-id", "label": "short relationship, e.g. 'leads to', 'is a type of'" }
  ]
}

Rules:
- Extract between 6 and 14 of the most important concepts
- Every edge's source and target must reference an id present in nodes
- Build a connected graph: every node should have at least one edge
- ids must be short kebab-case slugs, unique
- Return only JSON, no markdown, no backticks`

  const raw = await callAIWithFallback(prompt)
  const cleaned = cleanJsonText(raw)

  try {
    const parsed = JSON.parse(cleaned) as {
      nodes?: Array<{ id?: unknown; label?: unknown; excerpt?: unknown }>
      edges?: Array<{ source?: unknown; target?: unknown; label?: unknown }>
    }

    const nodes: ConceptMapNode[] = (parsed.nodes || [])
      .filter((node) => node?.id && node?.label)
      .map((node) => ({
        id: String(node.id),
        label: String(node.label),
        excerpt: String(node.excerpt || ""),
      }))

    if (!nodes.length) throw new Error("No concepts extracted")

    const nodeIds = new Set(nodes.map((node) => node.id))

    const edges: ConceptMapEdge[] = (parsed.edges || [])
      .filter((edge) => nodeIds.has(String(edge?.source)) && nodeIds.has(String(edge?.target)))
      .map((edge) => ({
        source: String(edge.source),
        target: String(edge.target),
        label: edge.label ? String(edge.label) : undefined,
      }))

    return { nodes, edges }
  } catch {
    throw new Error("AI returned invalid concept map format. Please try again.")
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

export async function generateEduPilotGuideResponse(message: string): Promise<string> {
  const prompt = `You are EduPilot Guide, an in-app help assistant for the EduPilot platform.

Your role:
- Answer ONLY EduPilot-related questions
- Help users understand how to use app features
- Explain clearly in a guided way
- Give practical steps users can follow inside the app
- Suggest the correct EduPilot feature when useful

EduPilot areas you can explain:
- AI Tutor
- Notes
- Flashcards
- AI Voice
- Quiz
- Planner
- Dashboard
- Profile
- Pricing / plans
- Login / account / settings
- Help Center

Strict rules:
- If the user asks a non-EduPilot question, politely refuse and say you only help with EduPilot usage
- Do NOT provide general study answers or general knowledge
- Do NOT act like the main AI Tutor
- Keep answers app-focused, helpful, and concise
- Always format the answer in a clean step-by-step way

Response format rules:
- Start with 1 short intro sentence
- Then add:
Step 1: ...
Step 2: ...
Step 3: ...
- If relevant, add:
Tips:
- ...
- ...
- End with:
Try this next: ...

User question:
${message}

Answer as EduPilot Guide:`

  return callAIWithFallback(prompt)
}

// =========================
// Topic Difficulty Analyzer
// =========================

export interface TopicAnalysisResult {
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  estimatedHours: string
  confidence: number
  summary: string
  studyOrder: string[]
  prerequisites: string[]
  relatedConcepts: string[]
  revisionSessions: number
  tips: string[]
}

export async function analyzeTopic(topic: string): Promise<TopicAnalysisResult> {
  const prompt = `Analyze the complexity, requirements, and learning path for the academic/technical topic: "${topic}".

Return ONLY a valid JSON object. Do not include any markdown, code blocks, backticks, or explanatory text before or after the JSON.
The JSON object must have exactly the following structure:
{
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "estimatedHours": "e.g., 10-14",
  "confidence": 92,
  "summary": "a short AI summary of what this topic is and its learning curve (2-3 sentences)",
  "studyOrder": ["Step 1 explanation", "Step 2 explanation", ...],
  "prerequisites": ["Prerequisite 1", "Prerequisite 2", ...],
  "relatedConcepts": ["Concept 1", "Concept 2", ...],
  "revisionSessions": 4,
  "tips": ["Tip 1", "Tip 2", ...]
}

Ensure the values are realistic and highly helpful for a student studying this topic.`

  const raw = await callAIWithFallback(prompt)
  const cleaned = cleanJsonText(raw)

  try {
    const parsed = JSON.parse(cleaned)
    
    // Validate difficulty
    let difficulty: "Beginner" | "Intermediate" | "Advanced" = "Intermediate"
    const parsedDiff = String(parsed.difficulty || "").trim().toLowerCase()
    if (parsedDiff === "beginner" || parsedDiff === "intermediate" || parsedDiff === "advanced") {
      difficulty = (parsedDiff.charAt(0).toUpperCase() + parsedDiff.slice(1)) as "Beginner" | "Intermediate" | "Advanced"
    }

    return {
      difficulty,
      estimatedHours: String(parsed.estimatedHours || "10-15").trim(),
      confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 85)),
      summary: String(parsed.summary || `A study profile for ${topic}.`).trim(),
      studyOrder: Array.isArray(parsed.studyOrder) ? parsed.studyOrder.map(String).filter(Boolean) : [],
      prerequisites: Array.isArray(parsed.prerequisites) ? parsed.prerequisites.map(String).filter(Boolean) : [],
      relatedConcepts: Array.isArray(parsed.relatedConcepts) ? parsed.relatedConcepts.map(String).filter(Boolean) : [],
      revisionSessions: Math.max(1, Number(parsed.revisionSessions) || 3),
      tips: Array.isArray(parsed.tips) ? parsed.tips.map(String).filter(Boolean) : [],
    }
  } catch (error) {
    console.error("[analyzeTopic] Malformed JSON from AI:", raw)
    throw new Error("AI returned an invalid response format. Please try again.")
  }
}
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

export async function generateEmbedding(text: string): Promise<number[]> {
  const key = getGeminiKey()
  const client = new GoogleGenerativeAI(key)
  const model = client.getGenerativeModel({ model: "text-embedding-004" })
  const result = await model.embedContent(text)
  const embedding = result.embedding
  return embedding.values
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

export type ExplainStyle = "simpler" | "analogy" | "step-by-step" | "real-world"

export const EXPLAIN_STYLE_LABELS: Record<ExplainStyle, string> = {
  simpler: "Simpler (ELI5)",
  analogy: "Use an analogy",
  "step-by-step": "Step-by-step",
  "real-world": "Real-world example",
}

const EXPLAIN_STYLE_INSTRUCTIONS: Record<ExplainStyle, string> = {
  simpler:
    "Explain it in the simplest possible terms, as if to someone with no background in the subject. Avoid jargon, use short sentences.",
  analogy:
    "Explain it using a clear, relatable analogy or metaphor that makes the concept easy to visualize and remember.",
  "step-by-step":
    "Break it down into clear, numbered steps that build up to the full explanation, one idea at a time.",
  "real-world":
    "Explain it using a concrete real-world example or practical scenario where this concept actually applies.",
}

export async function generateAlternateExplanation(
  question: string,
  previousAnswer: string,
  style: ExplainStyle
): Promise<string> {
  const prompt = `You are EduPilot, an AI tutor. A student asked the following question:
"${question}"

They already received this explanation but found it hard to understand:
"${previousAnswer}"

Re-explain the answer to the same question in a different way. ${EXPLAIN_STYLE_INSTRUCTIONS[style]}

Stay accurate and stay focused on the original question. Do not just repeat the previous explanation in different words — genuinely change the approach.`

  return callAIWithFallback(prompt)
}

// =========================
// Quiz
// =========================

export type QuizFormat = "mcq" | "short_answer"

export interface QuizQuestion {
  question: string
  options: string[]
  answer: string
  explanation: string
  type: QuizFormat
}

function normalizeQuizItem(item: unknown, index: number, format: QuizFormat = "mcq"): QuizQuestion {
  const raw = (item || {}) as {
    question?: unknown
    options?: unknown
    answer?: unknown
    explanation?: unknown
  }

  const question = String(raw.question || `Question ${index + 1}`).trim()
  const explanation = String(raw.explanation || "").trim()

  if (format === "short_answer") {
    const answer = String(raw.answer || "").trim() || "No answer provided."
    return { question, options: [], answer, explanation, type: "short_answer" }
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

  return { question, options, answer, explanation, type: "mcq" }
}

export type QuizDifficulty = "easy" | "medium" | "hard"

const QUIZ_DIFFICULTY_GUIDANCE: Record<QuizDifficulty, string> = {
  easy: "Keep questions at a beginner level: basic recall and simple definitions.",
  medium: "Keep questions at an intermediate level: application of concepts, not just recall.",
  hard: "Keep questions at an advanced level: multi-step reasoning, edge cases, and nuanced distinctions.",
}

function buildQuizQuestionSchema(format: QuizFormat) {
  if (format === "short_answer") {
    return `[
  {
    "question": "Question text?",
    "answer": "The ideal, concise expected answer (1-2 sentences)",
    "explanation": "Brief explanation"
  }
]`
  }

  return `[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A",
    "explanation": "Brief explanation"
  }
]`
}

function buildQuizFormatRules(count: number, format: QuizFormat) {
  if (format === "short_answer") {
    return `- Return only JSON
- No markdown
- No backticks
- Exactly ${count} questions
- Each question must require a short written answer (not multiple choice)
- "answer" must be the ideal expected answer, concise and specific
- Keep explanations short`
  }

  return `- Return only JSON
- No markdown
- No backticks
- Exactly ${count} questions
- Exactly 4 options per question
- "answer" must exactly match one option
- Questions should be educational and accurate
- Keep explanations short`
}

export async function generateQuiz(
  topic: string,
  count = 5,
  difficulty: QuizDifficulty = "medium",
  format: QuizFormat = "mcq"
): Promise<QuizQuestion[]> {
  const questionKind = format === "short_answer" ? "short-answer" : "multiple-choice"
  const prompt = `Generate exactly ${count} ${questionKind} quiz questions about "${topic}".

Difficulty: ${difficulty}. ${QUIZ_DIFFICULTY_GUIDANCE[difficulty]}

Return ONLY valid JSON array in this exact structure:
${buildQuizQuestionSchema(format)}

Rules:
${buildQuizFormatRules(count, format)}`

  const raw = await callAIWithFallback(prompt)
  const cleaned = cleanJsonText(raw)

  try {
    const parsed = JSON.parse(cleaned)

    if (!Array.isArray(parsed)) {
      throw new Error("Quiz response is not an array")
    }

    const normalized = parsed.slice(0, count).map((item, index) => normalizeQuizItem(item, index, format))

    if (!normalized.length) {
      throw new Error("No quiz questions generated")
    }

    return normalized
  } catch (error) {
    console.error("[generateQuiz] Invalid AI JSON:", raw)
    throw new Error("AI returned invalid quiz format. Please try again.")
  }
}

export async function generateQuizFromContent(
  title: string,
  content: string,
  count = 5,
  difficulty: QuizDifficulty = "medium",
  format: QuizFormat = "mcq"
): Promise<QuizQuestion[]> {
  const questionKind = format === "short_answer" ? "short-answer" : "multiple-choice"
  const prompt = `Read the study material below (titled "${title}") and generate exactly ${count} ${questionKind} quiz questions that test understanding of it.

Difficulty: ${difficulty}. ${QUIZ_DIFFICULTY_GUIDANCE[difficulty]}

Study material:
${content.slice(0, 12000)}

Return ONLY valid JSON array in this exact structure:
${buildQuizQuestionSchema(format)}

Rules:
- Base every question strictly on the material above
${buildQuizFormatRules(count, format)}`

  const raw = await callAIWithFallback(prompt)
  const cleaned = cleanJsonText(raw)

  try {
    const parsed = JSON.parse(cleaned)

    if (!Array.isArray(parsed)) {
      throw new Error("Quiz response is not an array")
    }

    const normalized = parsed.slice(0, count).map((item, index) => normalizeQuizItem(item, index, format))

    if (!normalized.length) {
      throw new Error("No quiz questions generated")
    }

    return normalized
  } catch (error) {
    console.error("[generateQuizFromContent] Invalid AI JSON:", raw)
    throw new Error("AI returned invalid quiz format. Please try again.")
  }
}

// =========================
// Short-Answer Grading
// =========================

export interface ShortAnswerGrade {
  isCorrect: boolean
  score: number
  feedback: string
}

export async function gradeShortAnswer(
  question: string,
  expectedAnswer: string,
  studentAnswer: string
): Promise<ShortAnswerGrade> {
  const prompt = `You are grading a student's short-answer response to a quiz question.

Question: "${question}"
Expected/ideal answer: "${expectedAnswer}"
Student's answer: "${studentAnswer?.trim() || "(no answer given)"}"

Judge whether the student's answer captures the key correct idea, even if worded differently. Minor
wording differences, synonyms, and partial phrasing are acceptable as long as the core meaning is
correct. An empty, off-topic, or clearly wrong answer is incorrect.

Return ONLY valid JSON in this exact shape:
{
  "isCorrect": true,
  "score": 1,
  "feedback": "One short sentence explaining the judgement."
}

Rules:
- "score" is a number between 0 and 1 (1 = fully correct, 0.5 = partially correct, 0 = incorrect)
- "isCorrect" should be true only when score is 0.6 or higher
- Return only JSON, no markdown, no backticks`

  const raw = await callAIWithFallback(prompt)
  const cleaned = cleanJsonText(raw)

  try {
    const parsed = JSON.parse(cleaned)
    const rawScore = Number(parsed.score)
    const score = Number.isFinite(rawScore) ? Math.min(1, Math.max(0, rawScore)) : parsed.isCorrect ? 1 : 0

    return {
      isCorrect: Boolean(parsed.isCorrect ?? score >= 0.6),
      score,
      feedback: String(parsed.feedback || "").trim(),
    }
  } catch (error) {
    console.error("[gradeShortAnswer] Invalid AI JSON:", raw)
    return {
      isCorrect: false,
      score: 0,
      feedback: "Could not automatically grade this answer. Please review it manually.",
    }
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

export async function generateFlashcardsFromContent(content: string, count = 10): Promise<Flashcard[]> {
  const prompt = `Read the study material below and create exactly ${count} educational flashcards that test the key concepts, facts, and definitions found in it.

Study material:
${content.slice(0, 12000)}

Return ONLY valid JSON array:
[
  {
    "front": "Question or key term",
    "back": "Clear answer or definition"
  }
]

Rules:
- Base every flashcard strictly on the material above
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
// Concept Map
// =========================

export interface ConceptMapNode {
  id: string
  label: string
  excerpt: string
}

export interface ConceptMapEdge {
  source: string
  target: string
  label?: string
}

export interface ConceptMapGraph {
  nodes: ConceptMapNode[]
  edges: ConceptMapEdge[]
}

export async function generateConceptMap(title: string, content: string): Promise<ConceptMapGraph> {
  const prompt = `Read the study material below (titled "${title}") and extract the key concepts and how they relate to one another, as a concept map.

Study material:
${content.slice(0, 12000)}

Return ONLY valid JSON in this exact shape:
{
  "nodes": [
    { "id": "short-slug", "label": "Concept name", "excerpt": "1-2 sentence explanation of this concept, grounded in the material" }
  ],
  "edges": [
    { "source": "node-id", "target": "node-id", "label": "short relationship, e.g. 'leads to', 'is a type of'" }
  ]
}

Rules:
- Extract between 6 and 14 of the most important concepts
- Every edge's source and target must reference an id present in nodes
- Build a connected graph: every node should have at least one edge
- ids must be short kebab-case slugs, unique
- Return only JSON, no markdown, no backticks`

  const raw = await callAIWithFallback(prompt)
  const cleaned = cleanJsonText(raw)

  try {
    const parsed = JSON.parse(cleaned) as {
      nodes?: Array<{ id?: unknown; label?: unknown; excerpt?: unknown }>
      edges?: Array<{ source?: unknown; target?: unknown; label?: unknown }>
    }

    const nodes: ConceptMapNode[] = (parsed.nodes || [])
      .filter((node) => node?.id && node?.label)
      .map((node) => ({
        id: String(node.id),
        label: String(node.label),
        excerpt: String(node.excerpt || ""),
      }))

    if (!nodes.length) throw new Error("No concepts extracted")

    const nodeIds = new Set(nodes.map((node) => node.id))

    const edges: ConceptMapEdge[] = (parsed.edges || [])
      .filter((edge) => nodeIds.has(String(edge?.source)) && nodeIds.has(String(edge?.target)))
      .map((edge) => ({
        source: String(edge.source),
        target: String(edge.target),
        label: edge.label ? String(edge.label) : undefined,
      }))

    return { nodes, edges }
  } catch {
    throw new Error("AI returned invalid concept map format. Please try again.")
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

export async function generateEduPilotGuideResponse(message: string): Promise<string> {
  const prompt = `You are EduPilot Guide, an in-app help assistant for the EduPilot platform.

Your role:
- Answer ONLY EduPilot-related questions
- Help users understand how to use app features
- Explain clearly in a guided way
- Give practical steps users can follow inside the app
- Suggest the correct EduPilot feature when useful

EduPilot areas you can explain:
- AI Tutor
- Notes
- Flashcards
- AI Voice
- Quiz
- Planner
- Dashboard
- Profile
- Pricing / plans
- Login / account / settings
- Help Center

Strict rules:
- If the user asks a non-EduPilot question, politely refuse and say you only help with EduPilot usage
- Do NOT provide general study answers or general knowledge
- Do NOT act like the main AI Tutor
- Keep answers app-focused, helpful, and concise
- Always format the answer in a clean step-by-step way

Response format rules:
- Start with 1 short intro sentence
- Then add:
Step 1: ...
Step 2: ...
Step 3: ...
- If relevant, add:
Tips:
- ...
- ...
- End with:
Try this next: ...

User question:
${message}

Answer as EduPilot Guide:`

  return callAIWithFallback(prompt)
}

// =========================
// Topic Difficulty Analyzer
// =========================

export interface TopicAnalysisResult {
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  estimatedHours: string
  confidence: number
  summary: string
  studyOrder: string[]
  prerequisites: string[]
  relatedConcepts: string[]
  revisionSessions: number
  tips: string[]
}

export async function analyzeTopic(topic: string): Promise<TopicAnalysisResult> {
  const prompt = `Analyze the complexity, requirements, and learning path for the academic/technical topic: "${topic}".

Return ONLY a valid JSON object. Do not include any markdown, code blocks, backticks, or explanatory text before or after the JSON.
The JSON object must have exactly the following structure:
{
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "estimatedHours": "e.g., 10-14",
  "confidence": 92,
  "summary": "a short AI summary of what this topic is and its learning curve (2-3 sentences)",
  "studyOrder": ["Step 1 explanation", "Step 2 explanation", ...],
  "prerequisites": ["Prerequisite 1", "Prerequisite 2", ...],
  "relatedConcepts": ["Concept 1", "Concept 2", ...],
  "revisionSessions": 4,
  "tips": ["Tip 1", "Tip 2", ...]
}

Ensure the values are realistic and highly helpful for a student studying this topic.`

  const raw = await callAIWithFallback(prompt)
  const cleaned = cleanJsonText(raw)

  try {
    const parsed = JSON.parse(cleaned)
    
    // Validate difficulty
    let difficulty: "Beginner" | "Intermediate" | "Advanced" = "Intermediate"
    const parsedDiff = String(parsed.difficulty || "").trim().toLowerCase()
    if (parsedDiff === "beginner" || parsedDiff === "intermediate" || parsedDiff === "advanced") {
      difficulty = (parsedDiff.charAt(0).toUpperCase() + parsedDiff.slice(1)) as "Beginner" | "Intermediate" | "Advanced"
    }

    return {
      difficulty,
      estimatedHours: String(parsed.estimatedHours || "10-15").trim(),
      confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 85)),
      summary: String(parsed.summary || `A study profile for ${topic}.`).trim(),
      studyOrder: Array.isArray(parsed.studyOrder) ? parsed.studyOrder.map(String).filter(Boolean) : [],
      prerequisites: Array.isArray(parsed.prerequisites) ? parsed.prerequisites.map(String).filter(Boolean) : [],
      relatedConcepts: Array.isArray(parsed.relatedConcepts) ? parsed.relatedConcepts.map(String).filter(Boolean) : [],
      revisionSessions: Math.max(1, Number(parsed.revisionSessions) || 3),
      tips: Array.isArray(parsed.tips) ? parsed.tips.map(String).filter(Boolean) : [],
    }
  } catch (error) {
    console.error("[analyzeTopic] Malformed JSON from AI:", raw)
    throw new Error("AI returned an invalid response format. Please try again.")
  }
}
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

// =========================
// Essay Grader
// =========================

export interface EssayFeedback {
  grade: string
  pros: string[]
  cons: string[]
  suggestions: { quote: string; comment: string }[]
}

export async function gradeEssay(essay: string, rubric?: string): Promise<EssayFeedback> {
  const prompt = `You are a strict but fair expert academic evaluator. You are reviewing a student's essay.
${rubric ? `Here is the grading rubric or assignment prompt to base your evaluation on:\n"""\n${rubric}\n"""\n` : `Use standard academic writing standards for college-level essays (clear thesis, good structure, strong arguments, proper grammar).\n`}
Here is the student's essay:
"""
${essay.slice(0, 15000)}
"""

Evaluate the essay and provide structured feedback.
Return ONLY valid JSON in this exact shape:
{
  "grade": "Estimated Letter Grade (e.g., A-, B+, C)",
  "pros": ["Strength 1", "Strength 2"],
  "cons": ["Weakness 1", "Weakness 2"],
  "suggestions": [
    { "quote": "exact quote from the essay with a flaw", "comment": "how to improve this specific part" }
  ]
}

Rules:
- Return ONLY JSON.
- No markdown formatting outside the JSON, no backticks.
- suggestions array should have 2 to 5 items.`

  const raw = await callAIWithFallback(prompt)
  const cleaned = cleanJsonText(raw)

  try {
    const parsed = JSON.parse(cleaned)
    return {
      grade: String(parsed.grade || "N/A"),
      pros: Array.isArray(parsed.pros) ? parsed.pros.map(String) : [],
      cons: Array.isArray(parsed.cons) ? parsed.cons.map(String) : [],
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions.map((s: any) => ({
            quote: String(s?.quote || ""),
            comment: String(s?.comment || ""),
          }))
        : [],
    }
  } catch (error) {
    console.error("[gradeEssay] Invalid AI JSON:", raw)
    throw new Error("AI returned invalid evaluation format. Please try again.")
  }
}
