export type SavedQuizOption = {
  id: string
  text: string
}

export type SavedQuizQuestion = {
  id: string
  question: string
  options: SavedQuizOption[]
  correctOptionId: string
  explanation?: string | null
}

export type SavedQuizAnswer = {
  questionId: string
  selectedOptionId: string | null
  isCorrect: boolean
}

export type SavedQuizAttemptRecord = {
  id: string
  user_id: string
  topic: string
  total_questions: number
  score: number
  percentage: number
  questions: SavedQuizQuestion[]
  answers: SavedQuizAnswer[]
  created_at: string
  updated_at: string
}

export async function saveQuizAttempt(
  userId: string,
  input: {
    topic: string
    questions: SavedQuizQuestion[]
    answers: SavedQuizAnswer[]
    score: number
    totalQuestions: number
    percentage: number
  }
) {
  const admin = await getSupabaseAdmin()

  const payload = {
    user_id: userId,
    topic: input.topic,
    total_questions: input.totalQuestions,
    score: input.score,
    percentage: input.percentage,
    questions: input.questions,
    answers: input.answers,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await admin
    .from("saved_quiz_attempts")
    .insert(payload)
    .select("*")
    .single()

  if (error) {
    throw new Error(`Failed to save quiz attempt: ${error.message}`)
  }

  return data as SavedQuizAttemptRecord
}

export async function getSavedQuizAttempts(userId: string, limit = 12) {
  const admin = await getSupabaseAdmin()

  const { data, error } = await admin
    .from("saved_quiz_attempts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    const message = error.message?.toLowerCase() || ""
    if (message.includes("saved_quiz_attempts")) {
      return []
    }
    throw new Error(`Failed to load quiz history: ${error.message}`)
  }

  return (data || []) as SavedQuizAttemptRecord[]
}

export async function getSavedQuizAttemptById(userId: string, attemptId: string) {
  const admin = await getSupabaseAdmin()

  const { data, error } = await admin
    .from("saved_quiz_attempts")
    .select("*")
    .eq("user_id", userId)
    .eq("id", attemptId)
    .maybeSingle()

  if (error) {
    const message = error.message?.toLowerCase() || ""
    if (message.includes("saved_quiz_attempts")) {
      return null
    }
    throw new Error(`Failed to load quiz attempt: ${error.message}`)
  }

  return (data || null) as SavedQuizAttemptRecord | null
}

export async function deleteSavedQuizAttempt(userId: string, attemptId: string) {
  const admin = await getSupabaseAdmin()

  const { error } = await admin
    .from("saved_quiz_attempts")
    .delete()
    .eq("user_id", userId)
    .eq("id", attemptId)

  if (error) {
    throw new Error(`Failed to delete quiz attempt: ${error.message}`)
  }

  return { success: true }
}