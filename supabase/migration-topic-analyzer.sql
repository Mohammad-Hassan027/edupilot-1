-- ============================================================
-- Migration: Topic Difficulty Analyzer History Table
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.topic_analysis_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic         TEXT NOT NULL,
  analysis_json JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.topic_analysis_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "topic_analysis_history_select_own" ON public.topic_analysis_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "topic_analysis_history_insert_own" ON public.topic_analysis_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "topic_analysis_history_delete_own" ON public.topic_analysis_history
  FOR DELETE USING (auth.uid() = user_id);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_topic_analysis_history_user_id ON public.topic_analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_analysis_history_created_at ON public.topic_analysis_history(created_at DESC);
