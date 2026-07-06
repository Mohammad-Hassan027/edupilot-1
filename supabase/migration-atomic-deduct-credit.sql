-- Atomic, conditional credit decrement.
--
-- Replaces the previous read-then-write in deductCredit(), which let two
-- concurrent requests for the same user both read the same remaining value
-- (e.g. 1) and each write 0, permitting two operations on a single credit.
--
-- The conditional UPDATE (... WHERE <col> > 0) is evaluated atomically under
-- row-level locking: when two calls race on the last credit, the first commits
-- the decrement to 0 and the second re-checks the WHERE against the updated row,
-- matches nothing, and reports 0 affected rows -> returns FALSE.
CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id UUID, p_feature TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  IF p_feature = 'ai_chat' THEN
    UPDATE public.credits
    SET ai_chat_remaining = ai_chat_remaining - 1,
        updated_at        = NOW()
    WHERE user_id = p_user_id AND ai_chat_remaining > 0;
  ELSIF p_feature = 'flashcards' THEN
    UPDATE public.credits
    SET flashcards_remaining = flashcards_remaining - 1,
        updated_at           = NOW()
    WHERE user_id = p_user_id AND flashcards_remaining > 0;
  ELSIF p_feature = 'study_plan' THEN
    UPDATE public.credits
    SET study_plan_remaining = study_plan_remaining - 1,
        updated_at           = NOW()
    WHERE user_id = p_user_id AND study_plan_remaining > 0;
  ELSE
    -- Unknown feature key: nothing to deduct.
    RETURN FALSE;
  END IF;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;
