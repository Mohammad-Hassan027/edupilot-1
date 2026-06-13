# Contributing to EduPilot

Thank you for your interest in contributing to EduPilot! 🎓

This project is part of the **Social Summer of Code (SSoC) Season 5.0 (2026)** open-source program. We look forward to working with you to enhance this AI study assistant.

Please note that we have a [Code of Conduct](CODE_OF_CONDUCT.md) that all contributors are expected to follow.

---

## 🚀 Social Summer of Code (SSoC) Rules

### 1. Issue Claiming
* View the open issues on the [EduPilot Issues Tab](https://github.com/MistryVishwa/edupilot-1/issues).
* Comment on the issue you wish to work on: **"I'd like to work on this issue. Please assign it to me."**
* **Wait for a Project Admin to assign the issue to you before starting work.**

### 2. Time limits
* Once assigned, you must submit a PR or draft PR showing active progress within **3 days (72 hours)**.
* If there is no activity, the issue will be unassigned to keep the program moving smoothly.

### 3. Claim Limits
* Only **one assigned issue per contributor** at any given time. Once your current PR is merged, you can claim your next issue!

---

## 🛠️ Step-by-Step Contribution Flow

### Step 1: Fork and Clone
1. Click the **Fork** button on the original [edupilot-1 repository](https://github.com/MistryVishwa/edupilot-1).
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/edupilot-1.git
   cd edupilot-1
   ```
3. Set the upstream remote:
   ```bash
   git remote add upstream https://github.com/MistryVishwa/edupilot-1.git
   ```

### Step 2: Branch Creation
Create a branch named after the feature or bug you are fixing:
```bash
git checkout main
git pull upstream main
git checkout -b feat/your-feature-name
```

### Step 3: Implement and Test
* Run the project locally using `npm run dev` and test your updates.
* Ensure all TypeScript code compiles without errors:
  ```bash
  npm run lint
  ```
* Ensure you don't commit temporary variables or raw API keys.

### Step 4: Commit and Push

This project enforces **Conventional Commits** via a `commit-msg` git hook (Husky + commitlint). Non-conforming commit messages are rejected automatically.

#### Commit Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:** `feat` · `fix` · `docs` · `style` · `refactor` · `perf` · `test` · `build` · `ci` · `chore` · `revert`

#### Good Commits

```bash
# New feature
feat: add flashcard export capability

# Bug fix with scope
fix(auth): resolve session expiration race condition

# Docs change
docs: update API authentication examples

# Feature with scope and issue reference
feat(quiz): add timed mode for practice sessions

Adds a countdown timer to quiz sessions. Timer duration is
configurable per session from the settings panel.

Closes #42

# Breaking change
feat(api)!: change response format to JSON:API

BREAKING CHANGE: All API responses now use camelCase keys.
Clients must update their parsers accordingly.
```

#### Bad Commits

```bash
# Too vague
fix: fixed it
update: updates
chore: misc changes

# Wrong tense (use imperative mood)
feat: added new feature
fix: fixes the bug

# Missing type prefix entirely
add flashcard export
update auth logic

# Description too long (max 72 chars)
feat: add a new feature that allows users to export their data in multiple formats including CSV, JSON, and XML

# All caps or sentence case description
feat: Add Flashcard Export
feat: ADD FLASHCARD EXPORT
```

#### Rules enforced by commitlint

| Rule | Requirement |
|------|-------------|
| Type | Must be one of the allowed types above |
| Scope | kebab-case if provided (`auth`, `quiz`, `api`) |
| Description | lowercase, max 72 characters, no trailing period |
| Body lines | max 100 characters per line |

```bash
git add .
git commit -m "feat: add flashcard export capability"
git push origin feat/your-feature-name
```

### Step 5: Submit a Pull Request
1. Open a PR from your branch on the original `edupilot-1` repository.
2. Fill out the PR template completely.
3. Link the PR to the assigned issue using keyword triggers (e.g. `Closes #15`).

---

## 🎨 Coding Standards & Conventions

* **React & Next.js**: Write functional components, use correct folder structure (pages inside `app/`, reusable layouts in `components/`), and use correct type assertions for TypeScript.
* **Database Queries**: Keep Supabase queries structured, secure, and handle authentication errors appropriately.
* **Styling**: We use **Tailwind CSS**. Ensure styles are fully responsive.
* **Code Cleanliness**: Remove console logs, unused imports, or unused state variables.

---

## 🔍 PR Review Process

* A Project Admin will review your PR.
* If changes are requested, apply them directly to your branch and push; the PR will update automatically.
* Once all tests pass and approvals are granted, we will merge the PR!

Thank you for contributing! 🚀
