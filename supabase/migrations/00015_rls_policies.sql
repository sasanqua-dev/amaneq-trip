-- ============================================================
-- users テーブル
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは全ユーザーの基本情報を参照可能
-- (トリップメンバー一覧、メール検索での招待に必要)
CREATE POLICY "users_select_authenticated"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

-- 自分のレコードのみ INSERT (初回ログイン時の upsert)
CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth0_id = (auth.jwt() ->> 'sub'));

-- 自分のレコードのみ UPDATE
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth0_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (auth0_id = (auth.jwt() ->> 'sub'));

-- ============================================================
-- trips テーブル
-- ============================================================
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- メンバーのみ参照可能
CREATE POLICY "trips_select_member"
  ON public.trips FOR SELECT
  TO authenticated
  USING (is_trip_member(id));

-- 認証済みユーザーなら誰でも新規作成可能
CREATE POLICY "trips_insert_authenticated"
  ON public.trips FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = current_app_user_id());

-- owner/editor のみ更新可能
CREATE POLICY "trips_update_editor"
  ON public.trips FOR UPDATE
  TO authenticated
  USING (is_trip_editor(id))
  WITH CHECK (is_trip_editor(id));

-- owner のみ削除可能
CREATE POLICY "trips_delete_owner"
  ON public.trips FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_id = id
        AND user_id = current_app_user_id()
        AND role = 'owner'
    )
  );

-- ============================================================
-- trip_members テーブル
-- ============================================================
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;

-- メンバーはそのトリップのメンバー一覧を参照可能
CREATE POLICY "trip_members_select_member"
  ON public.trip_members FOR SELECT
  TO authenticated
  USING (is_trip_member(trip_id));

-- owner/editor がメンバーを追加可能
CREATE POLICY "trip_members_insert_editor"
  ON public.trip_members FOR INSERT
  TO authenticated
  WITH CHECK (is_trip_editor(trip_id));

-- owner がメンバーのロールを変更可能
CREATE POLICY "trip_members_update_owner"
  ON public.trip_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members tm
      WHERE tm.trip_id = trip_members.trip_id
        AND tm.user_id = current_app_user_id()
        AND tm.role = 'owner'
    )
  );

-- owner がメンバーを削除可能、または自分自身が脱退可能
CREATE POLICY "trip_members_delete"
  ON public.trip_members FOR DELETE
  TO authenticated
  USING (
    user_id = current_app_user_id()
    OR EXISTS (
      SELECT 1 FROM public.trip_members tm
      WHERE tm.trip_id = trip_members.trip_id
        AND tm.user_id = current_app_user_id()
        AND tm.role = 'owner'
    )
  );

-- ============================================================
-- itinerary_items テーブル
-- ============================================================
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;

-- メンバーのみ参照可能
CREATE POLICY "itinerary_items_select_member"
  ON public.itinerary_items FOR SELECT
  TO authenticated
  USING (is_trip_member(trip_id));

-- owner/editor のみ追加可能
CREATE POLICY "itinerary_items_insert_editor"
  ON public.itinerary_items FOR INSERT
  TO authenticated
  WITH CHECK (is_trip_editor(trip_id));

-- owner/editor のみ更新可能
CREATE POLICY "itinerary_items_update_editor"
  ON public.itinerary_items FOR UPDATE
  TO authenticated
  USING (is_trip_editor(trip_id))
  WITH CHECK (is_trip_editor(trip_id));

-- owner/editor のみ削除可能
CREATE POLICY "itinerary_items_delete_editor"
  ON public.itinerary_items FOR DELETE
  TO authenticated
  USING (is_trip_editor(trip_id));

-- ============================================================
-- expenses テーブル
-- ============================================================
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- メンバーのみ参照可能
CREATE POLICY "expenses_select_member"
  ON public.expenses FOR SELECT
  TO authenticated
  USING (is_trip_member(trip_id));

-- owner/editor のみ追加可能
CREATE POLICY "expenses_insert_editor"
  ON public.expenses FOR INSERT
  TO authenticated
  WITH CHECK (is_trip_editor(trip_id));

-- owner/editor のみ更新可能
CREATE POLICY "expenses_update_editor"
  ON public.expenses FOR UPDATE
  TO authenticated
  USING (is_trip_editor(trip_id))
  WITH CHECK (is_trip_editor(trip_id));

-- owner/editor のみ削除可能
CREATE POLICY "expenses_delete_editor"
  ON public.expenses FOR DELETE
  TO authenticated
  USING (is_trip_editor(trip_id));

-- ============================================================
-- shared_trips テーブル
-- ============================================================
ALTER TABLE public.shared_trips ENABLE ROW LEVEL SECURITY;

-- メンバーは共有リンク一覧を参照可能
CREATE POLICY "shared_trips_select_member"
  ON public.shared_trips FOR SELECT
  TO authenticated
  USING (is_trip_member(trip_id));

-- owner/editor のみ共有リンクを作成可能
CREATE POLICY "shared_trips_insert_editor"
  ON public.shared_trips FOR INSERT
  TO authenticated
  WITH CHECK (is_trip_editor(trip_id));

-- owner/editor のみ共有リンクを更新可能 (無効化等)
CREATE POLICY "shared_trips_update_editor"
  ON public.shared_trips FOR UPDATE
  TO authenticated
  USING (is_trip_editor(trip_id))
  WITH CHECK (is_trip_editor(trip_id));

-- ============================================================
-- prefecture_visits テーブル
-- ============================================================
ALTER TABLE public.prefecture_visits ENABLE ROW LEVEL SECURITY;

-- 自分のデータのみ参照可能
CREATE POLICY "prefecture_visits_select_own"
  ON public.prefecture_visits FOR SELECT
  TO authenticated
  USING (user_id = current_app_user_id());

-- 自分のデータのみ追加可能
CREATE POLICY "prefecture_visits_insert_own"
  ON public.prefecture_visits FOR INSERT
  TO authenticated
  WITH CHECK (user_id = current_app_user_id());

-- 自分のデータのみ更新可能
CREATE POLICY "prefecture_visits_update_own"
  ON public.prefecture_visits FOR UPDATE
  TO authenticated
  USING (user_id = current_app_user_id())
  WITH CHECK (user_id = current_app_user_id());

-- 自分のデータのみ削除可能
CREATE POLICY "prefecture_visits_delete_own"
  ON public.prefecture_visits FOR DELETE
  TO authenticated
  USING (user_id = current_app_user_id());
