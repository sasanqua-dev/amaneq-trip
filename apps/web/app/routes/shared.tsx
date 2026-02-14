import { useParams } from "react-router";
import { useEffect, useState, useMemo } from "react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { Calendar, Receipt } from "lucide-react";
import { ItineraryTimeline } from "~/components/trips/itinerary-timeline";
import { createTypedSupabaseClient } from "@amaneq/core";
import type { ItineraryItem } from "~/lib/types/itinerary";

const statusLabels: Record<string, string> = {
  draft: "下書き",
  planned: "計画中",
  ongoing: "旅行中",
  completed: "完了",
};

const expenseCategoryLabels: Record<string, string> = {
  transport: "交通費",
  accommodation: "宿泊費",
  food: "食費",
  ticket: "チケット",
  shopping: "買い物",
  other: "その他",
};

export default function SharedTripPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [trip, setTrip] = useState<{
    title: string;
    description: string | null;
    status: string;
    start_date: string | null;
    end_date: string | null;
  } | null>(null);
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [expenses, setExpenses] = useState<Array<{
    id: string;
    title: string;
    amount: number;
    category: string | null;
  }>>([]);
  const [memberCount, setMemberCount] = useState(1);

  // Create anon client for public access (no auth required)
  const anonClient = useMemo(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createTypedSupabaseClient(url, key);
  }, []);

  useEffect(() => {
    if (!token || !anonClient) return;

    (async () => {
      // Fetch shared trip by token
      const { data: shareData } = await anonClient
        .from("shared_trips")
        .select("*, trips(*)")
        .eq("share_token", token)
        .eq("is_active", true)
        .single();

      if (!shareData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const share = shareData as {
        trip_id: string;
        expires_at: string | null;
        trips: {
          title: string;
          description: string | null;
          status: string;
          start_date: string | null;
          end_date: string | null;
        };
      };

      // Check expiration
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setTrip(share.trips);

      // Fetch itinerary, expenses, and member count in parallel
      const [itineraryResult, expenseResult, membersResult] = await Promise.all([
        anonClient
          .from("itinerary_items")
          .select("*")
          .eq("trip_id", share.trip_id)
          .order("day_number"),
        anonClient
          .from("expenses")
          .select("*")
          .eq("trip_id", share.trip_id),
        anonClient
          .from("trip_members")
          .select("id", { count: "exact", head: true })
          .eq("trip_id", share.trip_id),
      ]);

      const rawItems = (itineraryResult.data ?? []) as Array<{
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

      const rawExpenses = (expenseResult.data ?? []) as Array<{
        id: string;
        title: string;
        amount: number;
        category: string | null;
      }>;
      setExpenses(rawExpenses);
      setMemberCount(membersResult.count ?? 1);
      setLoading(false);
    })();
  }, [token, anonClient]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (notFound || !trip) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">ページが見つかりません</h1>
          <p className="text-muted-foreground">
            この共有リンクは無効か、期限が切れています。
          </p>
        </div>
      </div>
    );
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const perPerson = memberCount > 0 ? Math.ceil(totalExpenses / memberCount) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        <div>
          <p className="text-sm text-muted-foreground mb-1">共有された旅行</p>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{trip.title}</h1>
            <Badge variant="secondary">{statusLabels[trip.status]}</Badge>
          </div>
          {trip.description && <p className="text-muted-foreground mt-1">{trip.description}</p>}
          {(trip.start_date || trip.end_date) && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {trip.start_date ?? "未定"} ~ {trip.end_date ?? "未定"}
            </p>
          )}
        </div>

        {items.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">行程</h2>
            <ItineraryTimeline items={items} startDate={trip.start_date} readOnly />
          </section>
        )}

        {expenses.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              費用
            </h2>
            <Card>
              <CardContent className="pt-6 space-y-3">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span>{expense.title}</span>
                      {expense.category && (
                        <Badge variant="outline" className="text-xs">
                          {expenseCategoryLabels[expense.category] ?? expense.category}
                        </Badge>
                      )}
                    </div>
                    <span className="font-medium">&yen;{expense.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t pt-3 flex items-center justify-between font-semibold">
                  <span>1人あたり</span>
                  <span>&yen;{perPerson.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        <footer className="text-center text-xs text-muted-foreground pt-4">
          Amaneq trip で作成された旅行プラン
        </footer>
      </div>
    </div>
  );
}
