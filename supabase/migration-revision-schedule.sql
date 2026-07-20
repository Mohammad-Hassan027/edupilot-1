-- Create revision_schedule table
CREATE TABLE IF NOT EXISTS public.revision_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  subject TEXT NOT NULL,
  study_date DATE NOT NULL DEFAULT CURRENT_DATE,
  scheduled_date DATE NOT NULL,
  revision_stage INTEGER NOT NULL DEFAULT 1,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  estimated_minutes INTEGER NOT NULL DEFAULT 15,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, topic, revision_stage)
);

-- Index frequently queried columns
CREATE INDEX IF NOT EXISTS idx_revision_schedule_user_id ON public.revision_schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_revision_schedule_scheduled_date ON public.revision_schedule(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_revision_schedule_status ON public.revision_schedule(status);

-- Enable RLS
ALTER TABLE public.revision_schedule ENABLE ROW LEVEL SECURITY;

-- Secure RLS Policies
CREATE POLICY "revision_schedule_select_own" ON public.revision_schedule
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "revision_schedule_insert_own" ON public.revision_schedule
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "revision_schedule_update_own" ON public.revision_schedule
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "revision_schedule_delete_own" ON public.revision_schedule
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger: auto-update updated_at
CREATE TRIGGER revision_schedule_updated_at
  BEFORE UPDATE ON public.revision_schedule
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
