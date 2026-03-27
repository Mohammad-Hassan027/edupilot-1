-- Create production-style activity session tracking table
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

-- Make sure usage_logs supports all feature types used by the dashboard.
ALTER TABLE public.usage_logs DROP CONSTRAINT IF EXISTS usage_logs_feature_check;
