-- Password reset OTP codes table (no user_id FK - email can be unverified)
CREATE TABLE IF NOT EXISTS public.password_reset_otps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  otp_hash   TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS password_reset_otps_email_idx ON public.password_reset_otps(email);

-- Row Level Security (service role bypasses this)
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;

-- No public access - only service role key can access
-- Cleanup old OTPs (auto-expire after 1 hour)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM public.password_reset_otps WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$;
