-- Migration: AI Goal Tracker & Achievement Badges
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)

-- ─── study_goals ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.study_goals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  goal_type     TEXT NOT NULL CHECK (goal_type IN ('daily', 'weekly', 'monthly')),
  target_value  INTEGER NOT NULL DEFAULT 1,
  current_value INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  due_date      TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── achievement_definitions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.achievement_definitions (
  id            TEXT PRIMARY KEY, -- deterministic slug e.g. 'first_ai_chat'
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  icon          TEXT NOT NULL, -- e.g. 'MessageSquare', 'Layers', 'Calendar', 'Flame', 'Award', 'Target', 'CheckCircle2', 'Trophy'
  category      TEXT NOT NULL,
  required_value INTEGER NOT NULL DEFAULT 1,
  xp_reward     INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── user_achievements ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES public.achievement_definitions(id) ON DELETE CASCADE,
  earned_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ─── user_xp ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_xp (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp   INTEGER NOT NULL DEFAULT 0,
  level      INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Row Level Security (RLS) ──────────────────────────────────────────────────
ALTER TABLE public.study_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS study_goals_select_own ON public.study_goals;
DROP POLICY IF EXISTS study_goals_insert_own ON public.study_goals;
DROP POLICY IF EXISTS study_goals_update_own ON public.study_goals;
DROP POLICY IF EXISTS study_goals_delete_own ON public.study_goals;

DROP POLICY IF EXISTS achievement_definitions_select_all ON public.achievement_definitions;

DROP POLICY IF EXISTS user_achievements_select_own ON public.user_achievements;

DROP POLICY IF EXISTS user_xp_select_own ON public.user_xp;

-- study_goals Policies
CREATE POLICY study_goals_select_own ON public.study_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY study_goals_insert_own ON public.study_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY study_goals_update_own ON public.study_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY study_goals_delete_own ON public.study_goals
  FOR DELETE USING (auth.uid() = user_id);

-- achievement_definitions Policies (Read-only for all authenticated users)
CREATE POLICY achievement_definitions_select_all ON public.achievement_definitions
  FOR SELECT USING (auth.role() = 'authenticated');

-- user_achievements Policies (Read-only for owner, inserted/managed server-side)
CREATE POLICY user_achievements_select_own ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);

-- user_xp Policies (Read-only for owner, updated/managed server-side)
CREATE POLICY user_xp_select_own ON public.user_xp
  FOR SELECT USING (auth.uid() = user_id);

-- ─── Triggers for auto-updating updated_at ──────────────────────────────────────
DROP TRIGGER IF EXISTS study_goals_updated_at ON public.study_goals;
CREATE TRIGGER study_goals_updated_at
  BEFORE UPDATE ON public.study_goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS user_xp_updated_at ON public.user_xp;
CREATE TRIGGER user_xp_updated_at
  BEFORE UPDATE ON public.user_xp
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── Indexes for performance ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_study_goals_user_id ON public.study_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_study_goals_status ON public.study_goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_user_id ON public.user_xp(user_id);

-- ─── Seed Achievement Definitions ──────────────────────────────────────────────
INSERT INTO public.achievement_definitions (id, title, description, icon, category, required_value, xp_reward)
VALUES
  ('first_ai_chat', 'First AI Chat', 'Start your first conversation with the AI Tutor.', 'MessageSquare', 'ai_chat', 1, 100),
  ('ten_flashcard_sets', '10 Flashcard Sets', 'Create 10 flashcard sets to aid your study.', 'Layers', 'flashcards', 10, 250),
  ('five_study_plans', '5 Study Plans', 'Generate 5 custom study plans.', 'Calendar', 'study_plan', 5, 200),
  ('seven_day_streak', '7-Day Learning Streak', 'Maintain a study streak for 7 consecutive days.', 'Flame', 'streak', 7, 350),
  ('one_hundred_ai_questions', '100 AI Questions', 'Ask the AI Tutor 100 questions.', 'Award', 'ai_questions', 100, 500),
  ('goal_setter', 'Goal Setter', 'Create your first study goal.', 'Target', 'create_goal', 1, 50),
  ('first_goal_completed', 'First Goal Completed', 'Successfully complete your first study goal.', 'CheckCircle2', 'complete_goal', 1, 100),
  ('twenty_five_goals_completed', 'Complete 25 Goals', 'Successfully complete 25 study goals.', 'Trophy', 'complete_goal', 25, 500)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  required_value = EXCLUDED.required_value,
  xp_reward = EXCLUDED.xp_reward;
