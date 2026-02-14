import { useAuth0 } from "react-native-auth0";
import { createTypedSupabaseClient } from "@amaneq/core";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export function useSupabase() {
  const { getCredentials } = useAuth0();
  return createTypedSupabaseClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    async () => {
      const credentials = await getCredentials();
      return credentials.accessToken;
    }
  );
}
