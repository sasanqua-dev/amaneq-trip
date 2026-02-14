import type { TypedSupabaseClient } from "../supabase";
import type { MemberRole } from "../types/database";

export async function createShareLink(
  client: TypedSupabaseClient,
  tripId: string,
  permission: MemberRole = "viewer",
  expiresAt?: string | null
) {
  const { data, error } = await client
    .from("shared_trips")
    .insert({
      trip_id: tripId,
      permission,
      expires_at: expiresAt ?? null,
    })
    .select()
    .single();
  return { data, error };
}

export async function getShareLinks(
  client: TypedSupabaseClient,
  tripId: string
) {
  const { data, error } = await client
    .from("shared_trips")
    .select("*")
    .eq("trip_id", tripId)
    .eq("is_active", true);
  return { data, error };
}

export async function getSharedTripByToken(
  client: TypedSupabaseClient,
  shareToken: string
) {
  const { data, error } = await client
    .from("shared_trips")
    .select("*, trips(*)")
    .eq("share_token", shareToken)
    .eq("is_active", true)
    .single();
  return { data, error };
}

export async function deactivateShareLink(
  client: TypedSupabaseClient,
  shareId: string
) {
  const { data, error } = await client
    .from("shared_trips")
    .update({ is_active: false })
    .eq("id", shareId)
    .select()
    .single();
  return { data, error };
}
