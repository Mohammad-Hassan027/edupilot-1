-- Recommended migration for reliable Razorpay tracking
alter table public.payments
  add column if not exists razorpay_order_id text,
  add column if not exists razorpay_payment_id text,
  add column if not exists razorpay_signature text,
  add column if not exists refunded boolean not null default false,
  add column if not exists updated_at timestamp with time zone not null default now();

create index if not exists payments_razorpay_order_id_idx
  on public.payments (razorpay_order_id);

create index if not exists payments_user_plan_status_idx
  on public.payments (user_id, plan_id, status, created_at desc);

update public.payments
set provider = 'razorpay'
where provider is null;
