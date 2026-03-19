-- ============================================================
-- EduPilot SaaS Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── profiles ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── credits ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.credits (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_chat_remaining       INTEGER NOT NULL DEFAULT 5,
  ai_chat_used            INTEGER NOT NULL DEFAULT 0,
  flashcards_remaining    INTEGER NOT NULL DEFAULT 3,
  flashcards_used         INTEGER NOT NULL DEFAULT 0,
  study_plan_remaining    INTEGER NOT NULL DEFAULT 2,
  study_plan_used         INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── subscriptions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'free'
                          CHECK (status IN ('free','trial','active','expired','cancelled')),
  plan_id               TEXT DEFAULT 'free',
  trial_active          BOOLEAN NOT NULL DEFAULT FALSE,
  trial_start           TIMESTAMPTZ,
  trial_expiry          TIMESTAMPTZ,
  subscription_start    TIMESTAMPTZ,
  subscription_end      TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── payments ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_order_id     TEXT NOT NULL UNIQUE,
  razorpay_payment_id   TEXT,
  razorpay_signature    TEXT,
  amount                INTEGER NOT NULL,           -- in paise
  currency              TEXT NOT NULL DEFAULT 'INR',
  status                TEXT NOT NULL DEFAULT 'created'
                          CHECK (status IN ('created','captured','failed','refunded')),
  plan_id               TEXT NOT NULL,
  refunded              BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── usage_logs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature     TEXT NOT NULL CHECK (feature IN ('ai_chat','flashcards','study_plan')),
  action      TEXT NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── feature_access ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feature_access (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature     TEXT NOT NULL,
  is_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, feature)
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_access ENABLE ROW LEVEL SECURITY;

-- profiles: users can read/update their own
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- credits: users can read their own (write via service role only)
CREATE POLICY "credits_select_own" ON public.credits
  FOR SELECT USING (auth.uid() = user_id);

-- subscriptions: users can read their own
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- payments: users can read their own
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- usage_logs: users can read their own
CREATE POLICY "usage_logs_select_own" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- feature_access: users can read their own
CREATE POLICY "feature_access_select_own" ON public.feature_access
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- Trigger: auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER credits_updated_at
  BEFORE UPDATE ON public.credits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Indexes for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id       ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_user_id         ON public.credits(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id   ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id        ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id      ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_feature      ON public.usage_logs(feature);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at   ON public.usage_logs(created_at DESC);
