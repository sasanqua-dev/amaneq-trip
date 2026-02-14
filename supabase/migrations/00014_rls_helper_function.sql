-- ヘルパー関数: Auth0 JWT の sub から内部 user_id (UUID) を取得
CREATE OR REPLACE FUNCTION current_app_user_id()
RETURNS UUID AS $$
  SELECT id FROM public.users
  WHERE auth0_id = (auth.jwt() ->> 'sub');
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ヘルパー関数: ユーザーが指定トリップのメンバーかどうかを確認
CREATE OR REPLACE FUNCTION is_trip_member(p_trip_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trip_members
    WHERE trip_id = p_trip_id
      AND user_id = current_app_user_id()
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ヘルパー関数: ユーザーが指定トリップの owner/editor かを確認
CREATE OR REPLACE FUNCTION is_trip_editor(p_trip_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trip_members
    WHERE trip_id = p_trip_id
      AND user_id = current_app_user_id()
      AND role IN ('owner', 'editor')
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- auth0_id のユニークインデックス (存在確認)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth0_id ON public.users(auth0_id);
