"use server";

import { ensureUser } from "@/lib/auth0";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type PrefectureVisitRow = Database["public"]["Tables"]["prefecture_visits"]["Row"];
type ItineraryRow = Database["public"]["Tables"]["itinerary_items"]["Row"];
type TripMemberRow = Database["public"]["Tables"]["trip_members"]["Row"];
type TripRow = Database["public"]["Tables"]["trips"]["Row"];

export async function getUserVisitData(): Promise<Record<number, number>> {
  const user = await ensureUser();
  if (!user) return {};

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("prefecture_visits")
    .select()
    .eq("user_id", user.dbId);

  if (error || !data) return {};

  const rows = data as PrefectureVisitRow[];
  const counts: Record<number, number> = {};
  for (const row of rows) {
    counts[row.prefecture_code] = (counts[row.prefecture_code] ?? 0) + 1;
  }
  return counts;
}

export interface PrefectureSpot {
  id: string;
  title: string;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  category: string | null;
  tripTitle: string;
  tripId: string;
}

export async function getPrefectureSpots(
  prefectureCode: number
): Promise<PrefectureSpot[]> {
  const user = await ensureUser();
  if (!user) return [];

  const supabase = createServerClient();

  // Get user's trip IDs
  const { data: memberData } = await supabase
    .from("trip_members")
    .select()
    .eq("user_id", user.dbId);

  const memberRows = (memberData ?? []) as TripMemberRow[];
  const tripIds = memberRows.map((m) => m.trip_id);
  if (tripIds.length === 0) return [];

  // Get itinerary items in the prefecture
  const { data: itemData, error } = await supabase
    .from("itinerary_items")
    .select()
    .eq("prefecture_code", prefectureCode)
    .in("trip_id", tripIds);

  if (error || !itemData) return [];

  const items = itemData as ItineraryRow[];

  // Get trip titles
  const uniqueTripIds = [...new Set(items.map((i) => i.trip_id))];
  const { data: tripData } = await supabase
    .from("trips")
    .select()
    .in("id", uniqueTripIds);

  const trips = (tripData ?? []) as TripRow[];
  const tripMap = new Map(trips.map((t) => [t.id, t.title]));

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    locationName: item.location_name,
    latitude: item.latitude,
    longitude: item.longitude,
    category: item.category,
    tripTitle: tripMap.get(item.trip_id) ?? "",
    tripId: item.trip_id,
  }));
}
