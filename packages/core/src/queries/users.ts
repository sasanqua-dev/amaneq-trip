import type { TypedSupabaseClient } from "../supabase";

export async function getCurrentUser(client: TypedSupabaseClient) {
  // RLS + current_app_user_id() で自分のデータのみ返る
  const { data, error } = await client
    .from("users")
    .select("*")
    .single();
  return { data, error };
}

export async function getUserByEmail(
  client: TypedSupabaseClient,
  email: string
) {
  const { data, error } = await client
    .from("users")
    .select("id, email, display_name, avatar_url")
    .eq("email", email)
    .single();
  return { data, error };
}

export async function updateUserProfile(
  client: TypedSupabaseClient,
  updates: { display_name?: string | null; avatar_url?: string | null }
) {
  const { data, error } = await client
    .from("users")
    .update(updates)
    .select()
    .single();
  return { data, error };
}

export async function upsertUser(
  client: TypedSupabaseClient,
  user: {
    auth0_id: string;
    email: string;
    display_name?: string | null;
    avatar_url?: string | null;
  }
) {
  const { data, error } = await client
    .from("users")
    .upsert(user, { onConflict: "auth0_id" })
    .select()
    .single();
  return { data, error };
}
