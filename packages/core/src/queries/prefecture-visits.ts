import type { TypedSupabaseClient } from "../supabase";

export async function getPrefectureVisits(
  client: TypedSupabaseClient,
  userId: string
) {
  const { data, error } = await client
    .from("prefecture_visits")
    .select("*")
    .eq("user_id", userId);
  return { data, error };
}

export async function upsertPrefectureVisit(
  client: TypedSupabaseClient,
  visit: {
    user_id: string;
    trip_id: string;
    prefecture_code: number;
    visited_at?: string | null;
  }
) {
  const { data, error } = await client
    .from("prefecture_visits")
    .upsert(visit)
    .select()
    .single();
  return { data, error };
}

export async function getPrefectureSpots(
  client: TypedSupabaseClient,
  userId: string,
  prefectureCode: number
) {
  // Get trips the user is a member of
  const { data: memberData } = await client
    .from("trip_members")
    .select("trip_id")
    .eq("user_id", userId);

  if (!memberData?.length) {
    return { data: [], error: null };
  }

  const tripIds = memberData.map((m) => m.trip_id);

  const { data, error } = await client
    .from("itinerary_items")
    .select("*, trips(title)")
    .eq("prefecture_code", prefectureCode)
    .in("trip_id", tripIds);

  return { data, error };
}
