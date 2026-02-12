import { notFound } from "next/navigation";
import { TripForm } from "@/components/trips/trip-form";
import { ensureUser } from "@/lib/auth0";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type TripRow = Database["public"]["Tables"]["trips"]["Row"];

interface EditTripPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function EditTripPage({ params }: EditTripPageProps) {
  const { tripId } = await params;
  const user = await ensureUser();
  if (!user) return null;

  const supabase = createServerClient();

  const { data } = await supabase
    .from("trips")
    .select()
    .eq("id", tripId)
    .single();

  const trip = data as TripRow | null;
  if (!trip) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">旅行を編集</h1>
      <TripForm
        tripId={tripId}
        defaultValues={{
          title: trip.title,
          description: trip.description,
          startDate: trip.start_date,
          endDate: trip.end_date,
          status: trip.status,
        }}
      />
    </div>
  );
}
