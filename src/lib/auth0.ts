import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { createClient } from "@supabase/supabase-js";

// Auth0 v4: 環境変数から自動的に設定を読み込み
// AUTH0_SECRET, AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, APP_BASE_URL
export const auth0 = new Auth0Client();

export async function ensureUser() {
  const session = await auth0.getSession();
  if (!session) return null;

  const { user } = session;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        auth0_id: user.sub,
        email: user.email ?? "",
        display_name: user.name ?? user.nickname ?? "",
        avatar_url: user.picture ?? "",
      },
      { onConflict: "auth0_id" }
    )
    .select("id")
    .single();

  if (error) {
    console.error("Failed to ensure user:", error);
    return null;
  }

  return { ...user, dbId: (data as { id: string }).id };
}
