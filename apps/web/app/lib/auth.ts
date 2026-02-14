import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { ensureUser } from "@amaneq/core";
import { useSupabase } from "./supabase";

export function useAppUser() {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const client = useSupabase();
  const [dbUserId, setDbUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    ensureUser(client, {
      auth0Id: user.sub ?? "",
      email: user.email ?? "",
      displayName: user.name ?? user.nickname ?? "",
      avatarUrl: user.picture ?? "",
    }).then((result) => {
      if (result.data) {
        setDbUserId(result.data.id);
      }
    });
  }, [isAuthenticated, user, client]);

  return { user, isAuthenticated, isLoading, dbUserId };
}
