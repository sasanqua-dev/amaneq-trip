import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ItineraryTimeline } from "@/components/trips/itinerary-timeline";
import { ItineraryForm } from "@/components/trips/itinerary-form";
import { TransportForm } from "@/components/trips/transport-form";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type ItineraryRow = Database["public"]["Tables"]["itinerary_items"]["Row"];

interface ItineraryPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function ItineraryPage({ params }: ItineraryPageProps) {
  const { tripId } = await params;

  const supabase = createServerClient();

  const [{ data: trip }, { data: rawItems }] = await Promise.all([
    supabase.from("trips").select("start_date").eq("id", tripId).single(),
    supabase
      .from("itinerary_items")
      .select()
      .eq("trip_id", tripId)
      .order("day_number"),
  ]);

  const typedItems = (rawItems ?? []) as ItineraryRow[];

  const items = typedItems.map((item) => ({
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
    category: item.category,
    transportType: item.transport_type,
    carNumber: item.car_number,
    seatNumber: item.seat_number,
    photoUrl: item.photo_url,
  }));

  const maxDay = items.length > 0 ? Math.max(...items.map((i) => i.dayNumber)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/trips/${tripId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">行程</h1>
        </div>
        <div className="flex gap-2">
          <TransportForm tripId={tripId} maxDay={maxDay} items={items} />
          <ItineraryForm tripId={tripId} maxDay={maxDay} items={items} />
        </div>
      </div>

      <ItineraryTimeline tripId={tripId} items={items} startDate={trip?.start_date ?? null} />
    </div>
  );
}
