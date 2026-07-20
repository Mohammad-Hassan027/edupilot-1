-- ============================================================
-- Referral program (issue #97)
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
--
-- Adds a unique referral_code per user (on profiles), a referrals table
-- tracking referrer/referred pairs through pending -> completed, and an
-- atomic RPC that marks a referral complete and awards bonus credits to
-- both parties in a single transaction (mirrors the deduct_credit() RPC
-- pattern in migration-atomic-deduct-credit.sql).
-- ============================================================

-- ─── profiles.referral_code ────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Unique so a code can be looked up back to exactly one referrer.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_key
  ON public.profiles (referral_code)
  WHERE referral_code IS NOT NULL;

-- ─── referrals ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referrals (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id  UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code     TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'completed')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  -- A user can never redeem their own referral code.
  CONSTRAINT referrals_no_self_referral CHECK (referrer_id <> referred_user_id)
);

-- referred_user_id already being UNIQUE is what enforces "one referral
-- redemption per account" — a given account can appear as the referred party
-- at most once, ever.
CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON public.referrals (referrer_id);
CREATE INDEX IF NOT EXISTS referrals_status_idx ON public.referrals (status);

-- ─── complete_referral RPC ──────────────────────────────────────────────────
-- Atomically flips a pending referral to completed and bumps bonus credits
-- for both the referrer and the referred user. Guarded by
-- "WHERE status = 'pending'" so concurrent/duplicate calls (e.g. a retried
-- request) can only ever pay out once per referral row.
CREATE OR REPLACE FUNCTION public.complete_referral(
  p_referred_user_id UUID,
  p_bonus_credits INTEGER DEFAULT 5
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_referrer_id UUID;
  v_updated INTEGER;
BEGIN
  UPDATE public.referrals
  SET status = 'completed',
      completed_at = NOW()
  WHERE referred_user_id = p_referred_user_id
    AND status = 'pending'
  RETURNING referrer_id INTO v_referrer_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RETURN FALSE;
  END IF;

  -- Award the referrer.
  UPDATE public.credits
  SET ai_chat_remaining    = ai_chat_remaining + p_bonus_credits,
      flashcards_remaining = flashcards_remaining + p_bonus_credits,
      study_plan_remaining = study_plan_remaining + p_bonus_credits,
      updated_at           = NOW()
  WHERE user_id = v_referrer_id;

  -- Award the referred (new) user.
  UPDATE public.credits
  SET ai_chat_remaining    = ai_chat_remaining + p_bonus_credits,
      flashcards_remaining = flashcards_remaining + p_bonus_credits,
      study_plan_remaining = study_plan_remaining + p_bonus_credits,
      updated_at           = NOW()
  WHERE user_id = p_referred_user_id;

  RETURN TRUE;
END;
$$;
