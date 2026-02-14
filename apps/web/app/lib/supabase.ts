import { useAuth0 } from "@auth0/auth0-react";
import { useMemo } from "react";
import { createTypedSupabaseClient } from "@amaneq/core";

export function useSupabase() {
  const { getAccessTokenSilently } = useAuth0();
  return useMemo(
    () =>
      createTypedSupabaseClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        () => getAccessTokenSilently()
      ),
    [getAccessTokenSilently]
  );
}
