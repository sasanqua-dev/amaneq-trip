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

  // Find the current successor of the insertion point
  let successorQuery = supabase
    .from("itinerary_items")
    .select("id")
    .eq("trip_id", tripId)
    .eq("day_number", dayNumber);

  if (prevItemId) {
    successorQuery = successorQuery.eq("prev_item_id", prevItemId);
  } else {
    successorQuery = successorQuery.is("prev_item_id", null);
  }

  const { data: successorData } = await successorQuery.limit(1);
  const successor = (successorData ?? [])[0] as { id: string } | undefined;

  const prefectureCodeRaw = formData.get("prefectureCode") as string;
  const prefectureCode = prefectureCodeRaw ? parseInt(prefectureCodeRaw, 10) : null;
  const latitudeRaw = formData.get("latitude") as string;
  const longitudeRaw = formData.get("longitude") as string;
  const latitude = latitudeRaw ? parseFloat(latitudeRaw) : null;
  const longitude = longitudeRaw ? parseFloat(longitudeRaw) : null;

  const durationMinutesRaw = formData.get("durationMinutes") as string;
  const durationMinutes = durationMinutesRaw ? parseInt(durationMinutesRaw, 10) : null;
  const useDuration = durationMinutes !== null && durationMinutes > 0;

  // Insert the new item
  const { data: newItemData, error } = await supabase
    .from("itinerary_items")
    .insert({
      trip_id: tripId,
      day_number: dayNumber,
      prev_item_id: prevItemId,
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
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create itinerary item: ${error.message}`);

  const newItemId = (newItemData as { id: string }).id;

  // Update the successor to point to the new item
  if (successor) {
    await supabase
      .from("itinerary_items")
      .update({ prev_item_id: newItemId })
      .eq("id", successor.id);
  }

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

  if (positionChanged && current) {
    // Step 1: Remove from old position - update old successor to skip this item
    await supabase
      .from("itinerary_items")
      .update({ prev_item_id: current.prev_item_id })
      .eq("prev_item_id", itemId);

    // Step 2: Find new successor at the target position
    let successorQuery = supabase
      .from("itinerary_items")
      .select("id")
      .eq("trip_id", tripId)
      .eq("day_number", newDayNumber)
      .neq("id", itemId);

    if (newPrevItemId) {
      successorQuery = successorQuery.eq("prev_item_id", newPrevItemId);
    } else {
      successorQuery = successorQuery.is("prev_item_id", null);
    }

    const { data: successorData } = await successorQuery.limit(1);
    const successor = (successorData ?? [])[0] as { id: string } | undefined;

    // Update the new successor to point to this item
    if (successor) {
      await supabase
        .from("itinerary_items")
        .update({ prev_item_id: itemId })
        .eq("id", successor.id);
    }
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

  // Update the item itself
  const { error } = await supabase
    .from("itinerary_items")
    .update({
      day_number: newDayNumber,
      prev_item_id: newPrevItemId,
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

export async function deleteItineraryItem(itemId: string, tripId: string) {
  const user = await ensureUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = createServerClient();
  await checkMembership(supabase, tripId, user.dbId);

  // Get the item's prev_item_id before deleting
  const { data: itemData } = await supabase
    .from("itinerary_items")
    .select("prev_item_id")
    .eq("id", itemId)
    .single();

  const item = itemData as { prev_item_id: string | null } | null;

  // Update successor to skip the deleted item
  if (item) {
    await supabase
      .from("itinerary_items")
      .update({ prev_item_id: item.prev_item_id })
      .eq("prev_item_id", itemId);
  }

  const { error } = await supabase
    .from("itinerary_items")
    .delete()
    .eq("id", itemId);

  if (error) throw new Error(`Failed to delete itinerary item: ${error.message}`);

  revalidatePath(`/trips/${tripId}/itinerary`);
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/map");
}
