-- Keep subscription sync reliable for instant plan activation
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'free';

UPDATE public.subscriptions
SET plan_id = COALESCE(plan_id, 'free')
WHERE plan_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_unique_idx
  ON public.subscriptions(user_id);

CREATE INDEX IF NOT EXISTS payments_user_id_status_idx
  ON public.payments(user_id, status, created_at DESC);
