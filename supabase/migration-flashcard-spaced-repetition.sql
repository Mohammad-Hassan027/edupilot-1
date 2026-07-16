-- Spaced-repetition scheduling for flashcards (issue #93).
--
-- Per-card scheduling state (interval, easeFactor, repetitions, nextReviewAt,
-- lastReviewedAt) already lives inside the `cards` JSONB array on
-- public.saved_flashcard_sets (see migration-flashcards.sql +
-- lib/database.ts SavedFlashcard type). This migration adds:
--   1. flashcard_reviews: an append-only log of every review event, so
--      review history persists between sessions independent of the
--      "current" scheduling state stored on the card itself.
--   2. get_due_flashcards: an optional SQL-level helper that unnests each
--      user's cards and returns the ones due for review, for callers that
--      want to query "due today" directly in SQL instead of the app-level
--      lib/database.ts#getDueFlashcards (which loads sets and filters in
--      JS). Both approaches read the same underlying data.

CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  set_id UUID NOT NULL REFERENCES public.saved_flashcard_sets(id) ON DELETE CASCADE,
  card_index INTEGER NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('again', 'hard', 'good', 'easy')),
  quality SMALLINT NOT NULL,
  interval_days INTEGER NOT NULL,
  ease_factor NUMERIC NOT NULL,
  repetitions INTEGER NOT NULL,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS flashcard_reviews_select_own ON public.flashcard_reviews;
CREATE POLICY flashcard_reviews_select_own ON public.flashcard_reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user_id ON public.flashcard_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_set_id ON public.flashcard_reviews(set_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_reviewed_at ON public.flashcard_reviews(reviewed_at DESC);

-- Optional SQL-level "due today" query, mirroring lib/database.ts#getDueFlashcards.
CREATE OR REPLACE FUNCTION public.get_due_flashcards(p_user_id UUID, p_before TIMESTAMPTZ DEFAULT NOW())
RETURNS TABLE (
  set_id UUID,
  topic TEXT,
  card_index INT,
  front TEXT,
  back TEXT,
  interval_days INT,
  ease_factor NUMERIC,
  repetitions INT,
  next_review_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    s.id AS set_id,
    s.topic,
    (elem.ordinality - 1)::INT AS card_index,
    elem.value->>'front' AS front,
    elem.value->>'back' AS back,
    COALESCE((elem.value->>'interval')::INT, 0) AS interval_days,
    COALESCE((elem.value->>'easeFactor')::NUMERIC, 2.5) AS ease_factor,
    COALESCE((elem.value->>'repetitions')::INT, 0) AS repetitions,
    COALESCE((elem.value->>'nextReviewAt')::TIMESTAMPTZ, s.created_at) AS next_review_at,
    (elem.value->>'lastReviewedAt')::TIMESTAMPTZ AS last_reviewed_at
  FROM public.saved_flashcard_sets s
  CROSS JOIN LATERAL jsonb_array_elements(s.cards) WITH ORDINALITY AS elem(value, ordinality)
  WHERE s.user_id = p_user_id
    AND COALESCE((elem.value->>'nextReviewAt')::TIMESTAMPTZ, s.created_at) <= p_before
  ORDER BY next_review_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_due_flashcards(UUID, TIMESTAMPTZ) TO authenticated, service_role;
