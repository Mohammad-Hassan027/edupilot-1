-- Run this in Supabase SQL Editor if you already have users with 0 credits
-- This resets credits to 20 for all free-plan users

-- 1. Bump credits back to 20 for existing users (non-trial, non-pro)
UPDATE public.credits c
SET
  ai_chat_remaining    = 20,
  ai_chat_used         = 0,
  flashcards_remaining = 20,
  flashcards_used      = 0,
  study_plan_remaining = 20,
  study_plan_used      = 0,
  updated_at           = NOW()
FROM public.subscriptions s
WHERE c.user_id = s.user_id
  AND s.status = 'free'
  AND s.trial_active = FALSE;

-- 2. Remove the CHECK constraint on usage_logs.feature so quiz/notes/planner can log
ALTER TABLE public.usage_logs DROP CONSTRAINT IF EXISTS usage_logs_feature_check;

-- 3. Verify
SELECT user_id, ai_chat_remaining, flashcards_remaining, study_plan_remaining 
FROM public.credits 
LIMIT 10;
