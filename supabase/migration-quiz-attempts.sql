CREATE TABLE IF NOT EXISTS public.saved_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  total_questions INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  percentage NUMERIC NOT NULL DEFAULT 0,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_type TEXT NOT NULL DEFAULT 'topic' CHECK (source_type IN ('topic', 'note', 'chat')),
  source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.saved_quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS saved_quiz_attempts_select_own ON public.saved_quiz_attempts;
CREATE POLICY saved_quiz_attempts_select_own ON public.saved_quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_quiz_attempts_user_id ON public.saved_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_quiz_attempts_created_at ON public.saved_quiz_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_quiz_attempts_topic ON public.saved_quiz_attempts(user_id, topic);
CREATE INDEX IF NOT EXISTS idx_saved_quiz_attempts_source ON public.saved_quiz_attempts(source_type, source_id);

DROP TRIGGER IF EXISTS saved_quiz_attempts_updated_at ON public.saved_quiz_attempts;
CREATE TRIGGER saved_quiz_attempts_updated_at
  BEFORE UPDATE ON public.saved_quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
