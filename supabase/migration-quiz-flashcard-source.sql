-- Allow generating quizzes directly from a saved flashcard deck.
-- Extends saved_quiz_attempts.source_type to also accept 'flashcards',
-- in addition to the existing 'topic' | 'note' | 'chat' values.

ALTER TABLE public.saved_quiz_attempts
  DROP CONSTRAINT IF EXISTS saved_quiz_attempts_source_type_check;

ALTER TABLE public.saved_quiz_attempts
  ADD CONSTRAINT saved_quiz_attempts_source_type_check
  CHECK (source_type IN ('topic', 'note', 'chat', 'flashcards'));
