import { useEffect } from "react";
import { subscribeToTable, type TypedSupabaseClient } from "@amaneq/core";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export function useRealtimeSubscription<T extends Record<string, unknown>>(
  client: TypedSupabaseClient | null,
  table: string,
  filter: string | undefined,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void
) {
  useEffect(() => {
    if (!client) return;

    const unsubscribe = subscribeToTable<T>(client, table, filter, callback);

    return () => {
      unsubscribe();
    };
  }, [client, table, filter]);
}
