import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types/database";

export type TypedSupabaseClient = SupabaseClient<Database>;

export function createTypedSupabaseClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
  getAccessToken: () => Promise<string>
): TypedSupabaseClient {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    accessToken: async () => {
      return await getAccessToken();
    },
  });
}
