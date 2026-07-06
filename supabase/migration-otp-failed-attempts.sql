-- Track failed verification attempts per OTP to prevent brute-forcing the
-- 6-digit password-reset code. After a threshold of wrong guesses the code is
-- invalidated and a fresh reset request is required.
ALTER TABLE public.password_reset_otps
  ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0;
