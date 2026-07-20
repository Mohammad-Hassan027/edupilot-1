-- Migration: Study Plan Reminders / Notifications
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
--
-- Adds an opt-in, per-plan email reminder toggle to saved_study_plans, plus
-- bookkeeping columns so the reminder cron job (app/api/planner/send-reminders)
-- can find due sessions and avoid sending the same reminder twice.

-- ─── saved_study_plans: reminder columns ───────────────────────────────────────
ALTER TABLE public.saved_study_plans
  ADD COLUMN IF NOT EXISTS reminders_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.saved_study_plans
  ADD COLUMN IF NOT EXISTS reminder_last_sent_at TIMESTAMPTZ;

-- Task ids (from the `tasks` jsonb array) that have already had a reminder
-- email sent for them, so the cron job never emails the same session twice.
ALTER TABLE public.saved_study_plans
  ADD COLUMN IF NOT EXISTS notified_task_ids JSONB NOT NULL DEFAULT '[]'::jsonb;

-- ─── Indexes ────────────────────────────────────────────────────────────────────
-- Speeds up the cron job's "which plans have reminders on" scan.
CREATE INDEX IF NOT EXISTS idx_saved_study_plans_reminders_enabled
  ON public.saved_study_plans (reminders_enabled)
  WHERE reminders_enabled = TRUE;

-- Note: RLS policies for saved_study_plans (owner-only access) are assumed to
-- already exist from whichever migration originally created the table. The
-- reminder cron route reads/writes via the Supabase service-role key (admin
-- client), which bypasses RLS, so no new policies are required here.
