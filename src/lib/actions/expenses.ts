"use server";

import { revalidatePath } from "next/cache";
import { ensureUser } from "@/lib/auth0";
import { createServerClient } from "@/lib/supabase/server";
import type { Database, ExpenseCategory } from "@/lib/supabase/types";

type TripMemberRow = Database["public"]["Tables"]["trip_members"]["Row"];

export async function createExpense(formData: FormData) {
  const user = await ensureUser();
  if (!user) throw new Error("Unauthorized");

  const supabase = createServerClient();
  const tripId = formData.get("tripId") as string;

  const { data: memberData } = await supabase
    .from("trip_members")
    .select()
    .eq("trip_id", tripId)
    .eq("user_id", user.dbId)
    .single();

  const member = memberData as TripMemberRow | null;
  if (!member || member.role === "viewer") {
    throw new Error("Permission denied");
  }

  const { error } = await supabase.from("expenses").insert({
    trip_id: tripId,
    title: formData.get("title") as string,
    amount: parseInt(formData.get("amount") as string, 10),
    category: ((formData.get("category") as string) || null) as ExpenseCategory | null,
    paid_by: user.dbId,
  });

  if (error) throw new Error(`Failed to create expense: ${error.message}`);

  revalidatePath(`/trips/${tripId}/expenses`);
  revalidatePath(`/trips/${tripId}`);
}

export async function deleteExpense(expenseId: string, tripId: string) {
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
  if (!member || member.role === "viewer") {
    throw new Error("Permission denied");
  }

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId);

  if (error) throw new Error(`Failed to delete expense: ${error.message}`);

  revalidatePath(`/trips/${tripId}/expenses`);
  revalidatePath(`/trips/${tripId}`);
}
