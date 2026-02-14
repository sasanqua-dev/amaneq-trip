import type { TypedSupabaseClient } from "../supabase";
import type { Database, ExpenseCategory } from "../types/database";

export async function getExpenses(
  client: TypedSupabaseClient,
  tripId: string
) {
  const { data, error } = await client
    .from("expenses")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function createExpense(
  client: TypedSupabaseClient,
  expense: {
    trip_id: string;
    title: string;
    amount: number;
    currency?: string;
    category?: ExpenseCategory | null;
    paid_by?: string | null;
    split_among?: string[];
    itinerary_item_id?: string | null;
  }
) {
  const { data, error } = await client
    .from("expenses")
    .insert(expense)
    .select()
    .single();
  return { data, error };
}

export async function deleteExpense(
  client: TypedSupabaseClient,
  expenseId: string
) {
  const { error } = await client
    .from("expenses")
    .delete()
    .eq("id", expenseId);
  return { error };
}
