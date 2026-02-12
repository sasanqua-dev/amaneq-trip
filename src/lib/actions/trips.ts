"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureUser } from "@/lib/auth0";
import { createServerClient } from "@/lib/supabase/server";
import type { Database, TripStatus } from "@/lib/supabase/types";

type TripRow = Database["public"]["Tables"]["trips"]["Row"];
type TripMemberRow = Database["public"]["Tables"]["trip_members"]["Row"];

export async function createTrip(formData: FormData) {
  const user = await ensureUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = createServerClient();

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const startDate = (formData.get("startDate") as string) || null;
  const endDate = (formData.get("endDate") as string) || null;
  const status = (formData.get("status") as TripStatus) || "draft";

  const { data, error } = await supabase
    .from("trips")
    .insert({
      owner_id: user.dbId,
      title,
      description,
      start_date: startDate,
      end_date: endDate,
      status,
    })
    .select()
    .single();

  if (error || !data) throw new Error(`Failed to create trip: ${error?.message}`);

  const trip = data as TripRow;

  await supabase.from("trip_members").insert({
    trip_id: trip.id,
    user_id: user.dbId,
    role: "owner",
  });

  revalidatePath("/trips");
  redirect(`/trips/${trip.id}`);
}

export async function updateTrip(tripId: string, formData: FormData) {
  const user = await ensureUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = createServerClient();

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

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const startDate = (formData.get("startDate") as string) || null;
  const endDate = (formData.get("endDate") as string) || null;
  const status = (formData.get("status") as TripStatus) || "draft";

  const { error } = await supabase
    .from("trips")
    .update({
      title,
      description,
      start_date: startDate,
      end_date: endDate,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tripId);

  if (error) throw new Error(`Failed to update trip: ${error.message}`);

  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/trips");
  redirect(`/trips/${tripId}`);
}

export async function deleteTrip(tripId: string) {
  const user = await ensureUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = createServerClient();

  const { data: tripData } = await supabase
    .from("trips")
    .select()
    .eq("id", tripId)
    .single();

  const trip = tripData as TripRow | null;
  if (!trip || trip.owner_id !== user.dbId) {
    throw new Error("Permission denied");
  }

  const { error } = await supabase.from("trips").delete().eq("id", tripId);

  if (error) throw new Error(`Failed to delete trip: ${error.message}`);

  revalidatePath("/trips");
  redirect("/trips");
}
