"use server";

import { revalidatePath } from "next/cache";
import { ensureUser } from "@/lib/auth0";
import { createServerClient } from "@/lib/supabase/server";
import type { Database, ItineraryCategory, TransportType } from "@/lib/supabase/types";

type TripMemberRow = Database["public"]["Tables"]["trip_members"]["Row"];
type TripRow = Database["public"]["Tables"]["trips"]["Row"];

const FIRST_SENTINEL = "__first__";

async function checkMembership(supabase: ReturnType<typeof createServerClient>, tripId: string, userId: string) {
  const { data: memberData } = await supabase
    .from("trip_members")
    .select()
    .eq("trip_id", tripId)
    .eq("user_id", userId)
    .single();

  const member = memberData as TripMemberRow | null;
  if (!member || member.role === "viewer") {
    throw new Error("Permission denied");
  }
  return member;
}

async function upsertPrefectureVisit(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  tripId: string,
  prefectureCode: number
) {
  const { data: tripData } = await supabase
    .from("trips")
    .select()
    .eq("id", tripId)
    .single();

  const trip = tripData as TripRow | null;

  await supabase.from("prefecture_visits").upsert(
    {
      user_id: userId,
      trip_id: tripId,
      prefecture_code: prefectureCode,
      visited_at: trip?.start_date ?? null,
    },
    { onConflict: "user_id,trip_id,prefecture_code" }
  );
}

function parsePrevItemId(raw: string | null): string | null {
  if (!raw || raw === FIRST_SENTINEL) return null;
  return raw;
}

export async function createItineraryItem(formData: FormData) {
  const user = await ensureUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = createServerClient();
  const tripId = formData.get("tripId") as string;
  await checkMembership(supabase, tripId, user.dbId);

  const dayNumber = parseInt(formData.get("dayNumber") as string, 10);
  const rawPrevItemId = formData.get("prevItemId") as string;
  const prevItemId = parsePrevItemId(rawPrevItemId);

  const prefectureCodeRaw = formData.get("prefectureCode") as string;
  const prefectureCode = prefectureCodeRaw ? parseInt(prefectureCodeRaw, 10) : null;
  const latitudeRaw = formData.get("latitude") as string;
  const longitudeRaw = formData.get("longitude") as string;
  const latitude = latitudeRaw ? parseFloat(latitudeRaw) : null;
  const longitude = longitudeRaw ? parseFloat(longitudeRaw) : null;

  const durationMinutesRaw = formData.get("durationMinutes") as string;
  const durationMinutes = durationMinutesRaw ? parseInt(durationMinutesRaw, 10) : null;
  const useDuration = durationMinutes !== null && durationMinutes > 0;

  // Use RPC for atomic linked-list insert (defers unique constraints)
  const { error } = await supabase.rpc("create_itinerary_item", {
    p_trip_id: tripId,
    p_day_number: dayNumber,
    p_prev_item_id: prevItemId,
    p_title: formData.get("title") as string,
    p_description: (formData.get("description") as string) || null,
    p_location_name: (formData.get("locationName") as string) || null,
    p_departure_name: (formData.get("departureName") as string) || null,
    p_arrival_name: (formData.get("arrivalName") as string) || null,
    p_prefecture_code: prefectureCode,
    p_latitude: latitude,
    p_longitude: longitude,
    p_start_time: useDuration ? null : (formData.get("startTime") as string) || null,
    p_end_time: useDuration ? null : (formData.get("endTime") as string) || null,
    p_duration_minutes: useDuration ? durationMinutes : null,
    p_category: (formData.get("category") as string) || null,
    p_transport_type: (formData.get("transportType") as string) || null,
    p_car_number: (formData.get("carNumber") as string) || null,
    p_seat_number: (formData.get("seatNumber") as string) || null,
    p_photo_url: (formData.get("photoUrl") as string) || null,
    p_google_place_id: (formData.get("googlePlaceId") as string) || null,
  });

  if (error) throw new Error(`Failed to create itinerary item: ${error.message}`);

  // Auto-register prefecture visit
  if (prefectureCode) {
    await upsertPrefectureVisit(supabase, user.dbId, tripId, prefectureCode);
  }

  revalidatePath(`/trips/${tripId}/itinerary`);
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/map");
}

export async function updateItineraryItem(formData: FormData) {
  const user = await ensureUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = createServerClient();
  const itemId = formData.get("itemId") as string;
  const tripId = formData.get("tripId") as string;
  await checkMembership(supabase, tripId, user.dbId);

  const newDayNumber = parseInt(formData.get("dayNumber") as string, 10);
  const rawPrevItemId = formData.get("prevItemId") as string;
  const newPrevItemId = parsePrevItemId(rawPrevItemId);

  // Get current item data
  const { data: currentData } = await supabase
    .from("itinerary_items")
    .select("day_number, prev_item_id")
    .eq("id", itemId)
    .single();

  const current = currentData as { day_number: number; prev_item_id: string | null } | null;

  const positionChanged = current && (
    current.day_number !== newDayNumber ||
    current.prev_item_id !== newPrevItemId
  );

  // Handle position change atomically via RPC (defers unique constraints)
  if (positionChanged) {
    const { error: moveError } = await supabase.rpc("move_itinerary_item", {
      p_item_id: itemId,
      p_trip_id: tripId,
      p_new_day_number: newDayNumber,
      p_new_prev_item_id: newPrevItemId,
    });
    if (moveError) throw new Error(`Failed to move itinerary item: ${moveError.message}`);
  }

  const prefectureCodeRaw = formData.get("prefectureCode") as string;
  const prefectureCode = prefectureCodeRaw ? parseInt(prefectureCodeRaw, 10) : null;
  const latitudeRaw = formData.get("latitude") as string;
  const longitudeRaw = formData.get("longitude") as string;
  const latitude = latitudeRaw ? parseFloat(latitudeRaw) : null;
  const longitude = longitudeRaw ? parseFloat(longitudeRaw) : null;

  const durationMinutesRaw = formData.get("durationMinutes") as string;
  const durationMinutes = durationMinutesRaw ? parseInt(durationMinutesRaw, 10) : null;
  const useDuration = durationMinutes !== null && durationMinutes > 0;

  // Update the item's data fields (position already handled by RPC if changed)
  const { error } = await supabase
    .from("itinerary_items")
    .update({
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      location_name: (formData.get("locationName") as string) || null,
      departure_name: (formData.get("departureName") as string) || null,
      arrival_name: (formData.get("arrivalName") as string) || null,
      prefecture_code: prefectureCode,
      latitude,
      longitude,
      start_time: useDuration ? null : (formData.get("startTime") as string) || null,
      end_time: useDuration ? null : (formData.get("endTime") as string) || null,
      duration_minutes: useDuration ? durationMinutes : null,
      category: ((formData.get("category") as string) || null) as ItineraryCategory | null,
      transport_type: ((formData.get("transportType") as string) || null) as TransportType | null,
      car_number: (formData.get("carNumber") as string) || null,
      seat_number: (formData.get("seatNumber") as string) || null,
      photo_url: (formData.get("photoUrl") as string) || null,
      google_place_id: (formData.get("googlePlaceId") as string) || null,
    })
    .eq("id", itemId);

  if (error) throw new Error(`Failed to update itinerary item: ${error.message}`);

  if (prefectureCode) {
    await upsertPrefectureVisit(supabase, user.dbId, tripId, prefectureCode);
  }

  revalidatePath(`/trips/${tripId}/itinerary`);
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/map");
}

const recommendationCategoryMap: Record<string, string> = {
  グルメ: "meal",
  カフェ: "meal",
  観光: "sightseeing",
  ショッピング: "other",
  体験: "sightseeing",
  "温泉・リラクゼーション": "other",
};

export async function addRecommendationToTimeline(
  tripId: string,
  dayNumber: number,
  prevItemId: string | null,
  name: string,
  category: string,
  description: string
) {
  const user = await ensureUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = createServerClient();
  await checkMembership(supabase, tripId, user.dbId);

  const itineraryCategory = recommendationCategoryMap[category] ?? "other";

  const { error } = await supabase.rpc("create_itinerary_item", {
    p_trip_id: tripId,
    p_day_number: dayNumber,
    p_prev_item_id: prevItemId,
    p_title: name,
    p_description: description,
    p_location_name: null,
    p_departure_name: null,
    p_arrival_name: null,
    p_prefecture_code: null,
    p_latitude: null,
    p_longitude: null,
    p_start_time: null,
    p_end_time: null,
    p_duration_minutes: null,
    p_category: itineraryCategory,
    p_transport_type: null,
    p_car_number: null,
    p_seat_number: null,
    p_photo_url: null,
    p_google_place_id: null,
  });

  if (error) throw new Error(`Failed to add recommendation: ${error.message}`);

  revalidatePath(`/trips/${tripId}/itinerary`);
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/map");
}

export async function deleteItineraryItem(itemId: string, tripId: string) {
  const user = await ensureUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = createServerClient();
  await checkMembership(supabase, tripId, user.dbId);

  // Use RPC for atomic linked-list delete (defers unique constraints)
  const { error } = await supabase.rpc("delete_itinerary_item", {
    p_item_id: itemId,
  });

  if (error) throw new Error(`Failed to delete itinerary item: ${error.message}`);

  revalidatePath(`/trips/${tripId}/itinerary`);
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/map");
}
