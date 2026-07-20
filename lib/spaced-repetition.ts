// SM-2 spaced-repetition scheduling.
//
// Reference: P.A. Wozniak's SuperMemo 2 algorithm. Given the previous
// scheduling state of a card and a 0-5 recall-quality score, this computes
// the next repetition count, ease factor, and interval (in days).
//
// Rating buttons in the UI ("Again" / "Hard" / "Good" / "Easy") map to a
// quality score via RATING_TO_QUALITY below rather than asking users to
// pick 0-5 directly.

export type ReviewRating = "again" | "hard" | "good" | "easy"

export const RATING_TO_QUALITY: Record<ReviewRating, number> = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
}

export interface SpacedRepetitionState {
  /** Current interval in days before this card is due again. 0 = never scheduled. */
  interval: number
  /** SM-2 ease factor. Starts at 2.5, never drops below 1.3. */
  easeFactor: number
  /** Number of consecutive successful (quality >= 3) repetitions. */
  repetitions: number
}

export interface SpacedRepetitionResult extends SpacedRepetitionState {
  /** ISO timestamp for when the card should next be reviewed. */
  nextReviewAt: string
}

export const DEFAULT_SPACED_REPETITION_STATE: SpacedRepetitionState = {
  interval: 0,
  easeFactor: 2.5,
  repetitions: 0,
}

const MIN_EASE_FACTOR = 1.3
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Compute the next SM-2 scheduling state for a card given a review rating.
 *
 * - "again" (quality < 3) resets repetitions to 0 and the interval to 1 day.
 * - Otherwise repetitions increment and the interval grows: 1 day after the
 *   first successful repetition, 6 days after the second, and
 *   round(previousInterval * easeFactor) thereafter.
 * - The ease factor is adjusted per the standard SM-2 formula and floored
 *   at 1.3 so cards never get scheduled arbitrarily far apart.
 */
export function computeNextReview(
  state: SpacedRepetitionState,
  rating: ReviewRating,
  now: Date = new Date()
): SpacedRepetitionResult {
  const quality = RATING_TO_QUALITY[rating]
  const previousEase = state.easeFactor ?? DEFAULT_SPACED_REPETITION_STATE.easeFactor
  const previousRepetitions = state.repetitions ?? DEFAULT_SPACED_REPETITION_STATE.repetitions
  const previousInterval = state.interval ?? DEFAULT_SPACED_REPETITION_STATE.interval

  let repetitions: number
  let interval: number

  if (quality < 3) {
    repetitions = 0
    interval = 1
  } else {
    repetitions = previousRepetitions + 1
    if (repetitions === 1) interval = 1
    else if (repetitions === 2) interval = 6
    else interval = Math.round(previousInterval * previousEase)
  }

  const easeFactor = Math.max(
    MIN_EASE_FACTOR,
    previousEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  )

  const nextReviewAt = new Date(now.getTime() + interval * DAY_MS)

  return { interval, easeFactor, repetitions, nextReviewAt: nextReviewAt.toISOString() }
}

/** True when a card's nextReviewAt is now or in the past (or unset). */
export function isCardDue(nextReviewAt: string | null | undefined, at: Date = new Date()): boolean {
  if (!nextReviewAt) return true
  return new Date(nextReviewAt).getTime() <= at.getTime()
}
