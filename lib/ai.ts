import { GoogleGenerativeAI } from "@google/generative-ai"

const SYSTEM_PROMPT = `You are EduPilot, an expert AI study assistant. You help students understand complex topics, create quizzes, explain concepts, summarize notes, and build personalized study plans.

Guidelines:
- Be clear, concise, and educational
- Use examples and analogies when helpful
- Structure longer answers with headings/bullet points
- For quiz requests, format questions clearly numbered
- Always encourage and support the learner
- Keep responses focused and relevant to studying`

let genAI: GoogleGenerativeAI | null = null

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not set")
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

export async function generateAIResponse(userMessage: string): Promise<string> {
  const ai = getGenAI()
  const model = ai.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_PROMPT,
  })

  const result = await model.generateContent(userMessage)
  const response = await result.response
  return response.text()
}

export async function generateFlashcards(
  topic: string,
  count: number = 5
): Promise<Array<{ question: string; answer: string }>> {
  const ai = getGenAI()
  const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" })

  const prompt = `Generate ${count} flashcards about "${topic}". 
Return ONLY valid JSON array in this exact format, no markdown, no explanation:
[{"question": "...", "answer": "..."}, ...]`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()

  try {
    // Strip any markdown code fences if present
    const cleaned = text.replace(/```json|```/g, "").trim()
    return JSON.parse(cleaned)
  } catch {
    // Fallback: return empty if parse fails
    return []
  }
}

export async function generateStudyPlan(
  subject: string,
  goal: string,
  days: number
): Promise<string> {
  const ai = getGenAI()
  const model = ai.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_PROMPT,
  })

  const prompt = `Create a ${days}-day study plan for the subject "${subject}" with the goal: "${goal}". 
Include daily topics, estimated time, and key milestones. Keep it practical and achievable.`

  const result = await model.generateContent(prompt)
  return result.response.text()
}
