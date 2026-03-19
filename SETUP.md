# EduPilot — Setup Guide

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free)
- A [Razorpay](https://razorpay.com) account (test mode, free)
- A [Google AI Studio](https://aistudio.google.com) account (free tier)

---

## Step 1 — Clone & Install

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
```

---

## Step 2 — Supabase Setup

### 2a. Create a project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a name, password, and region

### 2b. Run the database schema
1. In your Supabase dashboard → **SQL Editor**
2. Click **New Query**
3. Paste the entire contents of `supabase/schema.sql`
4. Click **Run**

### 2c. Get your API keys
1. Go to **Project Settings → API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### 2d. Configure Google OAuth (for Google login)
1. Go to **Authentication → Providers → Google**
2. Enable Google provider
3. Create OAuth credentials at [Google Cloud Console](https://console.cloud.google.com):
   - Create a project → APIs & Services → Credentials → OAuth 2.0 Client ID
   - Application type: **Web application**
   - Authorized redirect URI: `https://your-project-id.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret back into Supabase Google provider settings

### 2e. Configure Auth email settings
1. Go to **Authentication → URL Configuration**
2. Set **Site URL**: `http://localhost:3000` (dev) or your production URL
3. Add to **Redirect URLs**: `http://localhost:3000/auth/callback`

---

## Step 3 — Razorpay Setup (Test Mode)

1. Go to [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Sign up for a free account
3. Make sure you're in **Test Mode** (toggle at top)
4. Go to **Settings → API Keys → Generate Test Key**
5. Copy:
   - **Key ID** → `RAZORPAY_KEY_ID`
   - **Key Secret** → `RAZORPAY_SECRET_KEY`

### Test Cards (use these in the payment modal)
| Card Number | CVV | Expiry |
|-------------|-----|--------|
| 4111 1111 1111 1111 | Any 3 digits | Any future date |
| 5267 3181 8797 5449 | Any 3 digits | Any future date |

---

## Step 4 — Gemini API Key

1. Go to [aistudio.google.com](https://aistudio.google.com/app/apikey)
2. Click **Get API Key → Create API key**
3. Copy the key → `GEMINI_API_KEY`

---

## Step 5 — Fill in .env.local

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_SECRET_KEY=xxxx

GEMINI_API_KEY=AIza...

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Step 6 — Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Testing the Full Flow

### ✅ Registration
1. Go to `/register`
2. Fill in name, email, password (must meet strength requirements)
3. Check email for verification link (from Supabase)
4. Click verification link → redirected to `/login`

### ✅ Login
1. Go to `/login`
2. Enter credentials → redirected to `/dashboard`
3. Header should show your real name and plan status

### ✅ Google OAuth
1. Click "Continue with Google" on login or register page
2. Complete Google sign-in
3. Redirected to `/dashboard` automatically

### ✅ AI Tutor (Guest limit)
1. Log out / open incognito
2. Go to `/ai-tutor`
3. Ask 1 question — AI responds normally
4. Ask a 2nd question → Login gate modal appears

### ✅ AI Tutor (Authenticated + Credits)
1. Log in → go to `/ai-tutor`
2. Ask questions — credits deduct from your 5 free AI chats
3. After 5 messages → Credits Exhausted modal with trial CTA

### ✅ Trial Activation (Payment)
1. Go to `/billing`
2. Click upgrade / activate trial
3. Payment modal opens (shows ₹1 test charge)
4. Use test card: `4111 1111 1111 1111`
5. Payment completes → 14-day trial activated → credits refilled to 9999

### ✅ Route Protection
1. Log out
2. Try going to `/dashboard` directly
3. Should redirect to `/login?redirect=/dashboard`
4. After login → redirected back to `/dashboard`

---

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Project → Settings → Environment Variables
# Add all variables from .env.example
```

**Important after deploy:**
1. Update `NEXT_PUBLIC_SITE_URL` to your production URL
2. Update Supabase Auth → URL Configuration with your production URL
3. Update Supabase Auth → Redirect URLs with `https://yourdomain.com/auth/callback`
4. Update Google Cloud Console Authorized redirect URIs

---

## Project Structure (Backend files added)

```
edupilot/
├── types/
│   └── index.ts              # All TypeScript types
├── lib/
│   ├── auth.ts               # Password validation, error mapping
│   ├── ai.ts                 # Gemini AI wrapper
│   ├── credits.ts            # Credit consumption service
│   ├── database.ts           # All DB query helpers
│   ├── payments.ts           # Razorpay helpers
│   ├── supabase-client.ts    # Browser Supabase client
│   └── supabase-server.ts    # Server Supabase + admin client
├── hooks/
│   └── use-user.ts           # Client hook for user data
├── middleware.ts             # Route protection
├── supabase/
│   └── schema.sql            # Full database schema
├── app/
│   ├── auth/callback/        # Google OAuth callback
│   └── api/
│       ├── auth/
│       │   ├── login/        # POST — email login
│       │   ├── register/     # POST — email register
│       │   ├── logout/       # POST — sign out
│       │   └── google/       # GET — OAuth redirect
│       ├── ai/
│       │   ├── chat/         # POST — Gemini chat + credits
│       │   └── flashcards/   # POST — Gemini flashcards + credits
│       ├── user/
│       │   ├── profile/      # GET/PATCH — user profile
│       │   └── credits/      # GET — credit balance
│       ├── usage/
│       │   └── track/        # POST — log feature usage
│       └── payments/
│           ├── create-order/ # POST — Razorpay order
│           └── verify-payment/ # POST — verify + activate trial
└── components/
    ├── credits-exhausted-modal.tsx  # Credits CTA modal
    └── billing/
        └── payment-modal.tsx        # Wired payment flow
```

---

## Credit Limits (Free Plan)

| Feature | Free Credits |
|---------|-------------|
| AI Chat | 5 questions |
| Flashcards | 3 generations |
| Study Plan | 2 generations |

Trial (after ₹1 payment): **9,999 credits** on all features for 14 days.
