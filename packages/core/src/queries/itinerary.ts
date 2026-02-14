import type { TypedSupabaseClient } from "../supabase";
import type { Database } from "../types/database";

type ItineraryUpdate = Database["public"]["Tables"]["itinerary_items"]["Update"];

export async function getItineraryItems(
  client: TypedSupabaseClient,
  tripId: string
) {
  const { data, error } = await client
    .from("itinerary_items")
    .select("*")
    .eq("trip_id", tripId);
  return { data, error };
}

export async function createItineraryItem(
  client: TypedSupabaseClient,
  params: Database["public"]["Functions"]["create_itinerary_item"]["Args"]
) {
  const { data, error } = await client.rpc("create_itinerary_item", params);
  return { data, error };
}

export async function updateItineraryItem(
  client: TypedSupabaseClient,
  itemId: string,
  updates: ItineraryUpdate
) {
  const { data, error } = await client
    .from("itinerary_items")
    .update(updates)
    .eq("id", itemId)
    .select()
    .single();
  return { data, error };
}

export async function moveItineraryItem(
  client: TypedSupabaseClient,
  params: Database["public"]["Functions"]["move_itinerary_item"]["Args"]
) {
  const { data, error } = await client.rpc("move_itinerary_item", params);
  return { data, error };
}

export async function deleteItineraryItem(
  client: TypedSupabaseClient,
  itemId: string
) {
  const { data, error } = await client.rpc("delete_itinerary_item", {
    p_item_id: itemId,
  });
  return { data, error };
}
