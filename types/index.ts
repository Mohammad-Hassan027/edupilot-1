// ─── User & Auth ────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  user_id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

// ─── Credits ────────────────────────────────────────────────────────────────

export interface Credits {
  id: string
  user_id: string
  ai_chat_remaining: number
  ai_chat_used: number
  flashcards_remaining: number
  flashcards_used: number
  study_plan_remaining: number
  study_plan_used: number
  created_at: string
  updated_at: string
}

export type FeatureKey = "ai_chat" | "flashcards" | "study_plan"

export const FREE_CREDITS: Record<FeatureKey, number> = {
  ai_chat: 20,
  flashcards: 20,
  study_plan: 20,
}

// ─── Subscription & Trial ────────────────────────────────────────────────────

export type SubscriptionStatus = "free" | "trial" | "active" | "expired" | "cancelled"

export interface Subscription {
  id: string
  user_id: string
  status: SubscriptionStatus
  plan_id: string | null
  trial_active: boolean
  trial_start: string | null
  trial_expiry: string | null
  subscription_start: string | null
  subscription_end: string | null
  created_at: string
  updated_at: string
}

// ─── Payments ────────────────────────────────────────────────────────────────

export type PaymentStatus = "created" | "captured" | "failed" | "refunded"

export interface Payment {
  id: string
  user_id: string
  razorpay_order_id: string
  razorpay_payment_id: string | null
  razorpay_signature: string | null
  amount: number
  currency: string
  status: PaymentStatus
  plan_id: string
  refunded: boolean
  created_at: string
  updated_at: string
}

// ─── Usage Logs ──────────────────────────────────────────────────────────────

export interface UsageLog {
  id: string
  user_id: string
  feature: FeatureKey
  action: string
  metadata: Record<string, unknown> | null
  created_at: string
}

// ─── Feature Access ──────────────────────────────────────────────────────────

export interface FeatureAccess {
  id: string
  user_id: string
  feature: FeatureKey
  is_enabled: boolean
  created_at: string
  updated_at: string
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  learningStreak: number
  learningHours: number
  goalsCompleted: number
  totalGoals: number
  quizzesTaken: number
  avgQuizScore: number
  weeklyImprovement: number
}

export interface UserDashboardData {
  profile: Profile | null
  credits: Credits | null
  subscription: Subscription | null
  stats: DashboardStats
}

// ─── API Response helpers ────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: string
  code?: string
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

// ─── Password Validation ─────────────────────────────────────────────────────

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4
  label: "Too weak" | "Weak" | "Fair" | "Strong" | "Very strong"
  color: string
  checks: {
    minLength: boolean
    hasUppercase: boolean
    hasNumber: boolean
    hasSpecial: boolean
  }
}

// ─── Revision Scheduler ──────────────────────────────────────────────────────

export interface RevisionSchedule {
  id: string
  user_id: string
  topic: string
  subject: string
  study_date: string
  scheduled_date: string
  revision_stage: number
  priority: "low" | "medium" | "high"
  estimated_minutes: number
  status: "pending" | "completed"
  completed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface RevisionStats {
  pendingCount: number
  completedCount: number
  completedTodayCount: number
  overdueCount: number
  upcomingCount: number
  streakCount: number
}

