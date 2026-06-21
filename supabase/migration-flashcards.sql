CREATE TABLE IF NOT EXISTS public.saved_flashcard_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  card_count INTEGER NOT NULL DEFAULT 0,
  cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_type TEXT NOT NULL DEFAULT 'topic' CHECK (source_type IN ('topic', 'note', 'chat')),
  source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.saved_flashcard_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS saved_flashcard_sets_select_own ON public.saved_flashcard_sets;
CREATE POLICY saved_flashcard_sets_select_own ON public.saved_flashcard_sets
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_flashcard_sets_user_id ON public.saved_flashcard_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_flashcard_sets_created_at ON public.saved_flashcard_sets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_flashcard_sets_source ON public.saved_flashcard_sets(source_type, source_id);

DROP TRIGGER IF EXISTS saved_flashcard_sets_updated_at ON public.saved_flashcard_sets;
CREATE TRIGGER saved_flashcard_sets_updated_at
  BEFORE UPDATE ON public.saved_flashcard_sets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
