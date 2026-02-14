import type { TypedSupabaseClient } from "./supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export function subscribeToTable<T extends Record<string, unknown>>(
  client: TypedSupabaseClient,
  table: string,
  filter: string | undefined,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void
) {
  const channel = client
    .channel(`${table}-changes`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
        ...(filter ? { filter } : {}),
      },
      callback
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
