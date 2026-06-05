# 🎓 EduPilot — AI Study Assistant

[![SSoC Season 5](https://img.shields.io/badge/SSoC-2026-orange.svg?style=flat-square)](https://socialsummerofcode.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-blue.svg?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-emerald.svg?style=flat-square&logo=supabase)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-API-purple.svg?style=flat-square&logo=googlegemini)](https://ai.google.dev/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Gateway-blue.svg?style=flat-square)](https://razorpay.com/)

**EduPilot** is a feature-rich, full-stack AI Study Assistant designed to help students accelerate their learning, organize concepts, generate personalized study roadmaps, and practice with flashcards. The app features secure authentication, credit-based rate limits, premium plan upgrades with integrated test payments, and a fully polished user interface.

🌐 **Demo / Deployment**: [EduPilot on Vercel](https://github.com/MistryVishwa/edupilot-1) (Host URL managed by Project Admin)

---

## 🌟 Key Features

* **🤖 AI Study Tutor**: Chat with a persistent digital tutor powered by Gemini AI. Get custom answers, code explanations, and detailed study notes.
* **🃏 Flashcards Generator**: Automatically generate custom learning decks from any topic, complete with flip actions for interactive review.
* **📅 Adaptive Study Planner**: Build day-by-day learning roadmaps matching your goals, target duration, and study speed.
* **💳 Credit-Based Tier Limits**: Free plans limit guest requests to prevent abuse. Register for 5 free chat credits, 3 flashcard sets, and 2 study plans.
* **🔒 Supabase Auth (Email + Google OAuth)**: Secure registration, verification emails, and seamless login with Google.
* **💳 Razorpay Payment Flow**: Upgrade via a ₹1 trial checkout using Razorpay test credentials to instantly unlock premium credits (9,999 credits) for 14 days.
* **🛡️ Protected Layout Middleware**: Smart Next.js middleware routing that shields private dashboards and study tools from unauthenticated users.

---

## 🛠️ Technology Stack

* **Core Framework**: Next.js (App Router, Tailwind CSS, TypeScript)
* **Backend Database & Auth**: Supabase (PostgreSQL tables, Service Role triggers, Email templates, Auth rules)
* **AI Model Engine**: Google Gemini API via Developer SDK
* **Billing & Payments**: Razorpay Web Integration (Checkout Modal, Signature Verification APIs)
* **State & Hooks**: Custom client hook `use-user.ts` synchronizing profile, credits, and session states.

---

## 📂 Project Structure

```
edupilot/
├── app/                      # Next.js App Router Pages & APIs
│   ├── api/                  # Serverless Route Handlers
│   │   ├── ai/               # Gemini Chat & Flashcard APIs
│   │   ├── auth/             # Login, register, logout endpoints
│   │   ├── payments/         # Razorpay order generation & verification
│   │   ├── usage/            # Usage tracking database logger
│   │   └── user/             # Credit balance & profile metrics
│   ├── auth/callback/        # Google OAuth Redirect Landing
│   └── layout.tsx            # Main App Layout wrap
├── components/               # Resuable UI Components
│   ├── billing/              # Checkout buttons & Payment modal
│   ├── credits-exhausted/    # Credit upgrade warnings
│   └── ui/                   # Standard Radix primitives (button, input, etc.)
├── hooks/                    # React Hooks
│   └── use-user.ts           # Client-side user cache synchronize
├── lib/                      # Helper & Service layers
│   ├── auth.ts               # Password validation & crypt checks
│   ├── ai.ts                 # Gemini wrapper
│   ├── credits.ts            # Credit consumption service
│   ├── database.ts           # DB query wrapper
│   ├── payments.ts           # Razorpay configuration
│   ├── supabase-client.ts    # Client SDK init
│   └── supabase-server.ts    # Server Admin SDK init
├── supabase/                 # Database structure files
│   └── schema.sql            # Raw SQL dump (tables, relationships, functions)
├── middleware.ts             # Route protection middleware
├── package.json              # Scripts & node packages
└── tsconfig.json             # TypeScript configs
```

---

## ⚙️ Environment Variables Setup

Copy `.env.example` to create `.env.local` and add the following keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

RAZORPAY_KEY_ID=rzp_test_yourkey
RAZORPAY_SECRET_KEY=your-razorpay-secret

GEMINI_API_KEY=AIzaSyYourGeminiKey

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 🏁 Local Installation & Development

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (version 18 or higher) installed.

### 2. Clone the Repository
```bash
git clone https://github.com/MistryVishwa/edupilot-1.git
cd edupilot-1
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Supabase Setup & DB Initialization
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase dashboard.
3. Paste the contents of `supabase/schema.sql` and click **Run**.
4. Retrieve your API URLs & Keys from **Project Settings → API** and add them to `.env.local`.

### 5. Setup Google OAuth (Optional)
To enable Google sign-in:
1. Enable Google Provider in Supabase under **Authentication → Providers**.
2. Create credentials in [Google Cloud Console](https://console.cloud.google.com) (type: Web Application).
3. Set the authorized redirect URI to: `https://your-project-id.supabase.co/auth/v1/callback`
4. Add the Client ID and Client Secret into Supabase Google provider settings.

### 6. Run the Project
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 💳 Razorpay Testing Card Credentials

Use the following cards in the payment popup modal during testing:

| Card Number | CVV | Expiry |
|---|---|---|
| `4111 1111 1111 1111` | Any 3 digits | Any future date |
| `5267 3181 8797 5449` | Any 3 digits | Any future date |

---

## 🤝 Contribution Guidelines
To contribute to EduPilot, please refer to [CONTRIBUTING.md](CONTRIBUTING.md) to understand SSoC timelines, workflow requirements, and PR review practices.
