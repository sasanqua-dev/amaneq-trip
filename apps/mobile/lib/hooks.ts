import { useState, useEffect, useCallback } from "react";
import { useAuth0 } from "react-native-auth0";
import { createTypedSupabaseClient, type TypedSupabaseClient } from "@amaneq/core";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export function useSupabase(): TypedSupabaseClient | null {
  const { getCredentials, user } = useAuth0();
  const [client, setClient] = useState<TypedSupabaseClient | null>(null);

  useEffect(() => {
    if (!user) {
      setClient(null);
      return;
    }
    const c = createTypedSupabaseClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      async () => {
        const credentials = await getCredentials();
        if (!credentials?.accessToken) throw new Error("No access token");
        return credentials.accessToken;
      }
    );
    setClient(c);
  }, [user]);

  return client;
}

export function useAppUser() {
  const { user, isLoading, authorize, clearSession } = useAuth0();
  const supabase = useSupabase();
  const [dbUser, setDbUser] = useState<{
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null>(null);

  useEffect(() => {
    if (!supabase || !user?.sub) return;
    supabase
      .from("users")
      .upsert(
        {
          auth0_id: user.sub,
          email: user.email ?? "",
          display_name: user.name ?? user.nickname ?? null,
          avatar_url: user.picture ?? null,
        },
        { onConflict: "auth0_id" }
      )
      .select()
      .single()
      .then(({ data }) => {
        if (data) setDbUser(data);
      });
  }, [supabase, user?.sub]);

  const login = useCallback(async () => {
    await authorize();
  }, [authorize]);

  const logout = useCallback(async () => {
    await clearSession();
    setDbUser(null);
  }, [clearSession]);

  return {
    auth0User: user,
    dbUser,
    isLoading,
    isAuthenticated: !!user,
    supabase,
    login,
    logout,
  };
}
