import type { TypedSupabaseClient } from "../supabase";
import type { MemberRole } from "../types/database";

export async function getTripMembers(
  client: TypedSupabaseClient,
  tripId: string
) {
  const { data, error } = await client
    .from("trip_members")
    .select("*, users(email, display_name, avatar_url)")
    .eq("trip_id", tripId);
  return { data, error };
}

export async function checkMembership(
  client: TypedSupabaseClient,
  tripId: string,
  userId: string
) {
  const { data, error } = await client
    .from("trip_members")
    .select("*")
    .eq("trip_id", tripId)
    .eq("user_id", userId)
    .single();
  return { data, error };
}

export async function addTripMember(
  client: TypedSupabaseClient,
  tripId: string,
  userId: string,
  role: MemberRole = "viewer"
) {
  const { data, error } = await client
    .from("trip_members")
    .insert({ trip_id: tripId, user_id: userId, role })
    .select()
    .single();
  return { data, error };
}

export async function updateMemberRole(
  client: TypedSupabaseClient,
  memberId: string,
  role: MemberRole
) {
  const { data, error } = await client
    .from("trip_members")
    .update({ role })
    .eq("id", memberId)
    .select()
    .single();
  return { data, error };
}

export async function removeTripMember(
  client: TypedSupabaseClient,
  memberId: string
) {
  const { error } = await client
    .from("trip_members")
    .delete()
    .eq("id", memberId);
  return { error };
}
