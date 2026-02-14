import type { TypedSupabaseClient } from "../supabase";
import type { Database, TripStatus } from "../types/database";

type TripInsert = Database["public"]["Tables"]["trips"]["Insert"];
type TripUpdate = Database["public"]["Tables"]["trips"]["Update"];

export async function getTrips(client: TypedSupabaseClient) {
  const { data, error } = await client
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function getTrip(client: TypedSupabaseClient, tripId: string) {
  const { data, error } = await client
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single();
  return { data, error };
}

export async function createTrip(
  client: TypedSupabaseClient,
  trip: {
    owner_id: string;
    title: string;
    description?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    status?: TripStatus;
  }
) {
  const { data, error } = await client
    .from("trips")
    .insert(trip)
    .select()
    .single();
  return { data, error };
}

export async function updateTrip(
  client: TypedSupabaseClient,
  tripId: string,
  updates: TripUpdate
) {
  const { data, error } = await client
    .from("trips")
    .update(updates)
    .eq("id", tripId)
    .select()
    .single();
  return { data, error };
}

export async function deleteTrip(
  client: TypedSupabaseClient,
  tripId: string
) {
  const { error } = await client
    .from("trips")
    .delete()
    .eq("id", tripId);
  return { error };
}
