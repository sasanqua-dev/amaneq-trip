import type { TypedSupabaseClient } from "./supabase";

export async function ensureUser(
  client: TypedSupabaseClient,
  auth0User: {
    sub: string;
    email: string;
    name?: string | null;
    nickname?: string | null;
    picture?: string | null;
  }
) {
  const { data, error } = await client
    .from("users")
    .upsert(
      {
        auth0_id: auth0User.sub,
        email: auth0User.email,
        display_name: auth0User.name ?? auth0User.nickname ?? null,
        avatar_url: auth0User.picture ?? null,
      },
      { onConflict: "auth0_id" }
    )
    .select()
    .single();

  return { data, error };
}
