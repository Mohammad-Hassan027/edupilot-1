CREATE TABLE IF NOT EXISTS public.concept_maps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('note', 'chat')),
  source_id UUID NOT NULL,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.concept_maps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS concept_maps_select_own ON public.concept_maps;
CREATE POLICY concept_maps_select_own ON public.concept_maps
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_concept_maps_user_id ON public.concept_maps(user_id);
CREATE INDEX IF NOT EXISTS idx_concept_maps_created_at ON public.concept_maps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_concept_maps_source ON public.concept_maps(source_type, source_id);

DROP TRIGGER IF EXISTS concept_maps_updated_at ON public.concept_maps;
CREATE TRIGGER concept_maps_updated_at
  BEFORE UPDATE ON public.concept_maps
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
