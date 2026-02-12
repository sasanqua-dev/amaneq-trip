import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, MapPin, Receipt, Share2, Edit } from "lucide-react";
import { ensureUser } from "@/lib/auth0";
import { createServerClient } from "@/lib/supabase/server";
import { DeleteTripButton } from "@/components/trips/delete-trip-button";
import { ItineraryTimeline } from "@/components/trips/itinerary-timeline";
import type { Database } from "@/lib/supabase/types";

type TripRow = Database["public"]["Tables"]["trips"]["Row"];

const statusLabels: Record<string, string> = {
  draft: "下書き",
  planned: "計画中",
  ongoing: "旅行中",
  completed: "完了",
};

const statusVariants: Record<string, "default" | "secondary" | "outline"> = {
  draft: "outline",
  planned: "secondary",
  ongoing: "default",
  completed: "outline",
};

interface TripDetailPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function TripDetailPage({ params }: TripDetailPageProps) {
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

  const [itineraryResult, expenseResult] = await Promise.all([
    supabase
      .from("itinerary_items")
      .select()
      .eq("trip_id", tripId)
      .order("day_number"),
    supabase
      .from("expenses")
      .select()
      .eq("trip_id", tripId),
  ]);

  type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
  type ItineraryRow = Database["public"]["Tables"]["itinerary_items"]["Row"];

  const rawItems = (itineraryResult.data ?? []) as ItineraryRow[];
  const expenses = (expenseResult.data ?? []) as ExpenseRow[];

  const itineraryItems = rawItems.map((item) => ({
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

  const spotCount = rawItems.length;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const uniquePrefectures = new Set(
    rawItems.filter((p) => p.prefecture_code != null).map((p) => p.prefecture_code)
  ).size;
  const isOwner = trip.owner_id === user.dbId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{trip.title}</h1>
            <Badge variant={statusVariants[trip.status]}>
              {statusLabels[trip.status]}
            </Badge>
          </div>
          {trip.description && (
            <p className="text-muted-foreground mt-1">{trip.description}</p>
          )}
          {(trip.start_date || trip.end_date) && (
            <p className="text-sm text-muted-foreground mt-1">
              {trip.start_date ?? "未定"} ~ {trip.end_date ?? "未定"}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/trips/${tripId}/share`}>
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              共有
            </Button>
          </Link>
          <Link href={`/trips/${tripId}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              編集
            </Button>
          </Link>
          {isOwner && <DeleteTripButton tripId={tripId} />}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href={`/trips/${tripId}/itinerary`}>
          <Card className="transition-colors hover:bg-accent/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5" />
                行程
              </CardTitle>
              <CardDescription>
                日ごとのスケジュールを管理
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{spotCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">スポット</p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/trips/${tripId}/expenses`}>
          <Card className="transition-colors hover:bg-accent/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="h-5 w-5" />
                費用
              </CardTitle>
              <CardDescription>
                旅費の記録と精算
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                &yen;{totalExpenses.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">合計</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5" />
              訪問先
            </CardTitle>
            <CardDescription>
              訪れる都道府県
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{uniquePrefectures}</p>
            <p className="text-xs text-muted-foreground">都道府県</p>
          </CardContent>
        </Card>
      </div>

      {itineraryItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">行程</h2>
            <Link href={`/trips/${tripId}/itinerary`}>
              <Button variant="ghost" size="sm">
                すべて表示
              </Button>
            </Link>
          </div>
          <ItineraryTimeline
            items={itineraryItems}
            startDate={trip.start_date}
            readOnly
          />
        </div>
      )}
    </div>
  );
}
