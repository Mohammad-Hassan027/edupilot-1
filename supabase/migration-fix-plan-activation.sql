-- Ensure subscriptions always have a plan_id and are easy to sync after payment
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'free';

UPDATE public.subscriptions
SET plan_id = COALESCE(plan_id, 'free')
WHERE plan_id IS NULL;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS plan_id TEXT;

CREATE INDEX IF NOT EXISTS idx_payments_user_status_created_at
  ON public.payments(user_id, status, created_at DESC);
