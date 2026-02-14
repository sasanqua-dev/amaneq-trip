import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { TripForm } from "~/components/trips/trip-form";
import { useSupabase } from "~/lib/supabase";
import { useAppUser } from "~/lib/auth";
import { getTrip } from "@amaneq/core";
import type { TripStatus } from "@amaneq/core";

export default function TripEditPage() {
  const { tripId } = useParams();
  const client = useSupabase();
  const { dbUserId } = useAppUser();
  const [defaults, setDefaults] = useState<{
    title: string;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
    status: TripStatus;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId || !dbUserId) return;

    getTrip(client, tripId).then(({ data }) => {
      if (data) {
        setDefaults({
          title: data.title,
          description: data.description,
          startDate: data.start_date,
          endDate: data.end_date,
          status: data.status as TripStatus,
        });
      }
      setLoading(false);
    });
  }, [tripId, dbUserId, client]);

  if (loading || !defaults) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">旅行を編集</h1>
      <TripForm tripId={tripId} defaultValues={defaults} />
    </div>
  );
}
