"use server";

import { revalidatePath } from "next/cache";
import { ensureUser } from "@/lib/auth0";
import { createServerClient } from "@/lib/supabase/server";
import type { Database, MemberRole } from "@/lib/supabase/types";

type SharedTripRow = Database["public"]["Tables"]["shared_trips"]["Row"];
type TripMemberRow = Database["public"]["Tables"]["trip_members"]["Row"];
type TripRow = Database["public"]["Tables"]["trips"]["Row"];
type ItineraryRow = Database["public"]["Tables"]["itinerary_items"]["Row"];
type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];

export async function createShareLink(tripId: string, permission: MemberRole) {
  const user = await ensureUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = createServerClient();

  // Check that user has owner/editor role
  const { data: memberData } = await supabase
    .from("trip_members")
    .select()
    .eq("trip_id", tripId)
    .eq("user_id", user.dbId)
    .single();

  const member = memberData as TripMemberRow | null;
  if (!member || (member.role !== "owner" && member.role !== "editor")) {
    throw new Error("Permission denied");
  }

  const { data, error } = await supabase
    .from("shared_trips")
    .insert({
      trip_id: tripId,
      permission,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create share link: ${error?.message}`);
  }

  revalidatePath(`/trips/${tripId}/share`);
  return data as SharedTripRow;
}

export async function getShareLinks(tripId: string) {
  const user = await ensureUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = createServerClient();

  // Check membership
  const { data: memberData } = await supabase
    .from("trip_members")
    .select()
    .eq("trip_id", tripId)
    .eq("user_id", user.dbId)
    .single();

  const member = memberData as TripMemberRow | null;
  if (!member) {
    throw new Error("Permission denied");
  }

  const { data, error } = await supabase
    .from("shared_trips")
    .select()
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to get share links: ${error.message}`);

  return (data ?? []) as SharedTripRow[];
}

export async function revokeShareLink(shareId: string) {
  const user = await ensureUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = createServerClient();

  // Get the share link to find trip_id
  const { data: shareData } = await supabase
    .from("shared_trips")
    .select()
    .eq("id", shareId)
    .single();

  const share = shareData as SharedTripRow | null;
  if (!share) throw new Error("Share link not found");

  // Check permission
  const { data: memberData } = await supabase
    .from("trip_members")
    .select()
    .eq("trip_id", share.trip_id)
    .eq("user_id", user.dbId)
    .single();

  const member = memberData as TripMemberRow | null;
  if (!member || (member.role !== "owner" && member.role !== "editor")) {
    throw new Error("Permission denied");
  }

  const { error } = await supabase
    .from("shared_trips")
    .update({ is_active: false })
    .eq("id", shareId);

  if (error) throw new Error(`Failed to revoke share link: ${error.message}`);

  revalidatePath(`/trips/${share.trip_id}/share`);
}

export async function getSharedTripByToken(token: string) {
  const supabase = createServerClient();

  const { data: shareData } = await supabase
    .from("shared_trips")
    .select()
    .eq("share_token", token)
    .eq("is_active", true)
    .single();

  const share = shareData as SharedTripRow | null;
  if (!share) return null;

  // Check expiration
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return null;
  }

  // Fetch trip + itinerary + expenses + member count in parallel
  const [tripResult, itineraryResult, expenseResult, { count: memberCount }] =
    await Promise.all([
      supabase.from("trips").select().eq("id", share.trip_id).single(),
      supabase
        .from("itinerary_items")
        .select()
        .eq("trip_id", share.trip_id)
        .order("day_number", { ascending: true }),
      supabase.from("expenses").select().eq("trip_id", share.trip_id),
      supabase
        .from("trip_members")
        .select("id", { count: "exact", head: true })
        .eq("trip_id", share.trip_id),
    ]);

  const trip = tripResult.data as TripRow | null;
  if (!trip) return null;

  return {
    trip,
    permission: share.permission,
    memberCount: memberCount ?? 1,
    itinerary: (itineraryResult.data ?? []) as ItineraryRow[],
    expenses: (expenseResult.data ?? []) as ExpenseRow[],
  };
}

export async function joinTripAsEditor(
  token: string
): Promise<{ tripId: string } | null> {
  const user = await ensureUser();
  if (!user) return null;

  const supabase = createServerClient();

  // Validate share token
  const { data: shareData } = await supabase
    .from("shared_trips")
    .select()
    .eq("share_token", token)
    .eq("is_active", true)
    .single();

  const share = shareData as SharedTripRow | null;
  if (!share) return null;

  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return null;
  }

  if (share.permission !== "editor") return null;

  // Check existing membership
  const { data: memberData } = await supabase
    .from("trip_members")
    .select()
    .eq("trip_id", share.trip_id)
    .eq("user_id", user.dbId)
    .single();

  const member = memberData as TripMemberRow | null;

  if (!member) {
    await supabase.from("trip_members").insert({
      trip_id: share.trip_id,
      user_id: user.dbId,
      role: "editor" as MemberRole,
    });
  } else if (member.role === "viewer") {
    await supabase
      .from("trip_members")
      .update({ role: "editor" as MemberRole })
      .eq("id", member.id);
  }
  // owner / editor → no change

  return { tripId: share.trip_id };
}
