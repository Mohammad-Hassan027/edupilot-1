CREATE TABLE IF NOT EXISTS public.saved_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('pdf','spreadsheet','video')),
  source_title TEXT NOT NULL,
  source_label TEXT,
  source_hint TEXT,
  tabs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.saved_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS saved_notes_select_own ON public.saved_notes;
CREATE POLICY saved_notes_select_own ON public.saved_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_notes_user_id ON public.saved_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_notes_created_at ON public.saved_notes(created_at DESC);

DROP TRIGGER IF EXISTS saved_notes_updated_at ON public.saved_notes;
CREATE TRIGGER saved_notes_updated_at
  BEFORE UPDATE ON public.saved_notes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
