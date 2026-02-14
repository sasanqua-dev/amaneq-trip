import { Link, useParams } from "react-router";
import { useCallback, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ItineraryTimeline } from "~/components/trips/itinerary-timeline";
import { ItineraryForm } from "~/components/trips/itinerary-form";
import { TransportForm } from "~/components/trips/transport-form";
import { useSupabase } from "~/lib/supabase";
import { useAppUser } from "~/lib/auth";
import { getTrip, getItineraryItems, deleteItineraryItem } from "@amaneq/core";
import type { ItineraryItem } from "~/lib/types/itinerary";

export default function TripItineraryPage() {
  const { tripId } = useParams();
  const client = useSupabase();
  const { dbUserId } = useAppUser();
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!tripId || !dbUserId) return;

    const [tripResult, itemsResult] = await Promise.all([
      getTrip(client, tripId),
      getItineraryItems(client, tripId),
    ]);

    if (tripResult.data) {
      setStartDate((tripResult.data as { start_date: string | null }).start_date);
    }

    const rawItems = (itemsResult.data ?? []) as Array<{
      id: string;
      day_number: number;
      prev_item_id: string | null;
      title: string;
      description: string | null;
      location_name: string | null;
      departure_name: string | null;
      arrival_name: string | null;
      prefecture_code: number | null;
      latitude: number | null;
      longitude: number | null;
      start_time: string | null;
      end_time: string | null;
      duration_minutes: number | null;
      category: string | null;
      transport_type: string | null;
      car_number: string | null;
      seat_number: string | null;
      photo_url: string | null;
      google_place_id: string | null;
    }>;

    setItems(
      rawItems.map((item) => ({
        id: item.id,
        dayNumber: item.day_number,
        prevItemId: item.prev_item_id,
        title: item.title,
        description: item.description,
        locationName: item.location_name,
        departureName: item.departure_name,
        arrivalName: item.arrival_name,
        prefectureCode: item.prefecture_code,
        latitude: item.latitude,
        longitude: item.longitude,
        startTime: item.start_time,
        endTime: item.end_time,
        durationMinutes: item.duration_minutes,
        category: item.category as ItineraryItem["category"],
        transportType: item.transport_type as ItineraryItem["transportType"],
        carNumber: item.car_number,
        seatNumber: item.seat_number,
        photoUrl: item.photo_url,
        googlePlaceId: item.google_place_id,
      }))
    );

    setLoading(false);
  }, [tripId, dbUserId, client]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = useCallback(
    async (itemId: string) => {
      await deleteItineraryItem(client, itemId);
      loadData();
    },
    [client, loadData]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const maxDay = items.length > 0 ? Math.max(...items.map((i) => i.dayNumber)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/trips/${tripId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">行程</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <TransportForm tripId={tripId!} maxDay={maxDay} items={items} />
          <ItineraryForm tripId={tripId!} maxDay={maxDay} items={items} />
        </div>
      </div>

      <ItineraryTimeline
        tripId={tripId!}
        items={items}
        startDate={startDate}
        onDeleted={loadData}
        onUpdated={loadData}
      />
    </div>
  );
}
