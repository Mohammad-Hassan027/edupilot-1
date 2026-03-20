-- ============================================================
-- EduPilot: Fix credits for existing users
-- Run in Supabase SQL Editor → New Query → Run
-- ============================================================

-- 1. Bump all free-plan users back to 20 credits
UPDATE public.credits
SET
  ai_chat_remaining    = GREATEST(ai_chat_remaining, 20),
  flashcards_remaining = GREATEST(flashcards_remaining, 20),
  study_plan_remaining = GREATEST(study_plan_remaining, 20),
  updated_at           = NOW()
WHERE
  ai_chat_remaining < 20
  OR flashcards_remaining < 20
  OR study_plan_remaining < 20;

-- 2. Remove CHECK constraint on usage_logs.feature so quiz/notes/planner can log
ALTER TABLE public.usage_logs DROP CONSTRAINT IF EXISTS usage_logs_feature_check;

-- 3. Update default values in credits table
ALTER TABLE public.credits
  ALTER COLUMN ai_chat_remaining    SET DEFAULT 20,
  ALTER COLUMN flashcards_remaining SET DEFAULT 20,
  ALTER COLUMN study_plan_remaining SET DEFAULT 20;

-- Verify
SELECT
  COUNT(*) AS total_users,
  AVG(ai_chat_remaining)    AS avg_ai_credits,
  AVG(flashcards_remaining) AS avg_flash_credits
FROM public.credits;
