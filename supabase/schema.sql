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


-- ─── saved_notes ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saved_notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('pdf','spreadsheet','video')),
  source_title TEXT NOT NULL,
  source_label TEXT,
  source_hint TEXT,
  tabs        JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
ALTER TABLE public.saved_notes    ENABLE ROW LEVEL SECURITY;
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

-- saved_notes: users can read their own
CREATE POLICY "saved_notes_select_own" ON public.saved_notes
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

CREATE TRIGGER saved_notes_updated_at
  BEFORE UPDATE ON public.saved_notes
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
CREATE INDEX IF NOT EXISTS idx_saved_notes_user_id      ON public.saved_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_notes_created_at   ON public.saved_notes(created_at DESC);

-- ============================================================
-- Fix: missing chat_sessions, chat_messages, user_activity_sessions
-- ============================================================

-- ─── user_activity_sessions (from migration-activity-tracking.sql) ─────────
CREATE TABLE IF NOT EXISTS public.user_activity_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  path TEXT NOT NULL DEFAULT '/dashboard',
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_activity_sessions_user_id ON public.user_activity_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_sessions_started_at ON public.user_activity_sessions(started_at DESC);

ALTER TABLE public.user_activity_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_activity_sessions' AND policyname = 'user_activity_sessions_select_own'
  ) THEN
    CREATE POLICY "user_activity_sessions_select_own" ON public.user_activity_sessions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

ALTER TABLE public.usage_logs DROP CONSTRAINT IF EXISTS usage_logs_feature_check;

-- ─── chat_sessions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT,
  topic            TEXT,
  last_message_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chat_sessions' AND policyname = 'chat_sessions_select_own'
  ) THEN
    CREATE POLICY "chat_sessions_select_own" ON public.chat_sessions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message_at ON public.chat_sessions(last_message_at DESC);

-- ─── chat_messages ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chat_messages' AND policyname = 'chat_messages_select_own'
  ) THEN
    CREATE POLICY "chat_messages_select_own" ON public.chat_messages
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- ─── topic_analysis_history ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.topic_analysis_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic         TEXT NOT NULL,
  analysis_json JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.topic_analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "topic_analysis_history_select_own" ON public.topic_analysis_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "topic_analysis_history_insert_own" ON public.topic_analysis_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "topic_analysis_history_delete_own" ON public.topic_analysis_history
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_topic_analysis_history_user_id ON public.topic_analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_analysis_history_created_at ON public.topic_analysis_history(created_at DESC);

