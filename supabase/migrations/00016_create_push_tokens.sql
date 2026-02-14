-- push_tokens テーブル
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_tokens_select_own"
  ON public.push_tokens FOR SELECT
  TO authenticated
  USING (user_id = current_app_user_id());

CREATE POLICY "push_tokens_insert_own"
  ON public.push_tokens FOR INSERT
  TO authenticated
  WITH CHECK (user_id = current_app_user_id());

CREATE POLICY "push_tokens_update_own"
  ON public.push_tokens FOR UPDATE
  TO authenticated
  USING (user_id = current_app_user_id())
  WITH CHECK (user_id = current_app_user_id());

CREATE POLICY "push_tokens_delete_own"
  ON public.push_tokens FOR DELETE
  TO authenticated
  USING (user_id = current_app_user_id());
