# AGENTS.md — EduPilot

## Quick Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint (no separate typecheck script)
```

**No test suite exists.** There is no test framework, no test files, and no test script in package.json.

## Critical Quirks

- **`next.config.mjs` has `ignoreBuildErrors: true`** — TypeScript errors will NOT block builds. Run `npx tsc --noEmit` manually if you need type verification.
- **`proxy.ts` at project root is the middleware equivalent** — It's not named `middleware.ts`. Contains `PROTECTED_ROUTES` list and Supabase auth session check. Route protection logic lives here.
- **Conventional commits are enforced** — Husky `commit-msg` hook + commitlint. Commit messages must follow `type(scope): description` format. Bad commits are rejected.

## Architecture

- **Framework**: Next.js 16 (App Router), React 18, TypeScript 5.7, Tailwind CSS 4
- **UI**: shadcn/ui (`new-york` style, `lucide` icons). Components in `components/ui/`, config in `components.json`
- **Backend**: Supabase (Auth + PostgreSQL). Client lib in `lib/supabase-client.ts`, server lib in `lib/supabase-server.ts`
- **AI**: Google Gemini API via `lib/ai.ts`
- **Payments**: Razorpay via `lib/payments.ts`
- **Path alias**: `@/*` maps to project root

### Route Groups (`app/`)

| Group | Purpose | Protected? |
|-------|---------|-----------|
| `(public)` | Landing page, features, pricing, blog, legal pages | No |
| `(auth)` | Login, register, forgot-password | No (redirects logged-in users away) |
| `(dashboard)` | All study tools: ai-tutor, flashcards, planner, quiz, notes, billing, analytics, etc. | Yes |
| `api/` | Serverless route handlers (ai, auth, payments, usage, user, contact, help) | Varies |

### Protected Routes (from `proxy.ts`)

`/notes`, `/flashcards`, `/ai-voice`, `/quiz`, `/planner`, `/profile`, `/settings`, `/billing`, `/analytics`, `/time-tracking`, `/marketplace`

### Key Library Files

- `lib/credits.ts` — Credit consumption/checking logic (trial users get 9999 unlimited)
- `lib/auth.ts` — Password validation, auth error mapping (no active server session code — commented out)
- `lib/database.ts` — All Supabase query wrappers
- `hooks/use-user.tsx` — Client-side user state cache
- `types/index.ts` — All TypeScript types

## Environment Variables

Required in `.env.local` (copy from `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID`, `RAZORPAY_SECRET_KEY`
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_SITE_URL`

## Database

Schema in `supabase/schema.sql`. Additional migration files in `supabase/migration-*.sql` — these are standalone SQL, not a migration runner.

## Available Skills (`.agents/skills/`)

| Skill | What it does in this repo |
|-------|--------------------------|
| `conventional-commit` | Generates properly formatted commit messages following `type(scope): description` — enforced by the Husky `commit-msg` hook here |
| `tailwind-design-system` | Builds design tokens, component variants, and dark mode patterns using Tailwind CSS v4 (what this project uses) |
| `typescript-advanced-types` | Applies generics, mapped types, and utility types to strengthen type safety — useful given `ignoreBuildErrors: true` masks TS errors silently |
| `wcag-audit-patterns` | Audits pages for WCAG 2.2 accessibility violations and fixes them in dashboard/study tool components |

## Code Style

- Functional React components only
- Tailwind CSS for all styling (no CSS modules, no styled-components)
- `cn()` utility from `lib/utils.ts` for class merging (clsx + tailwind-merge)
- No console.logs or unused imports in committed code
