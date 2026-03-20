const GEMINI_MODEL = "gemini-1.5-flash"

async function callGemini(prompt: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  )

  const data = await res.json()

  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    ""
  )
}

export async function generateAIResponse(message: string) {
  const text = await callGemini(`
You are EduPilot AI Tutor.
Explain clearly, step by step, in a helpful teaching style.

User question:
${message}
`)
  return text || "AI unavailable"
}

export async function generateQuiz(topic: string) {
  const text = await callGemini(`
Generate exactly 5 multiple-choice questions about: ${topic}

Return ONLY valid JSON in this format:
[
  {
    "question": "string",
    "options": ["A", "B", "C", "D"],
    "answer": "A"
  }
]

No markdown. No extra text.
`)
  try {
    return JSON.parse(text)
  } catch {
    return []
  }
}

export async function generateFlashcards(topic: string) {
  const text = await callGemini(`
Generate flashcards about: ${topic}

Return ONLY valid JSON in this format:
[
  {
    "question": "string",
    "answer": "string"
  }
]

No markdown. No extra text.
`)
  try {
    return JSON.parse(text)
  } catch {
    return []
  }
}