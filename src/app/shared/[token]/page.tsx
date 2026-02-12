import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Calendar, Receipt } from "lucide-react";
import { getSharedTripByToken } from "@/lib/actions/share";
import { ItineraryTimeline } from "@/components/trips/itinerary-timeline";
import type { Database } from "@/lib/supabase/types";
import type { ItineraryItem } from "@/lib/types/itinerary";

type ItineraryRow = Database["public"]["Tables"]["itinerary_items"]["Row"];
type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];

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

interface SharedTripPageProps {
  params: Promise<{ token: string }>;
}

export default async function SharedTripPage({ params }: SharedTripPageProps) {
  const { token } = await params;
  const result = await getSharedTripByToken(token);
  if (!result) notFound();

  const { trip, itinerary, expenses } = result;

  const items: ItineraryItem[] = itinerary.map((row) => ({
    id: row.id,
    dayNumber: row.day_number,
    prevItemId: row.prev_item_id,
    title: row.title,
    description: row.description,
    locationName: row.location_name,
    departureName: row.departure_name,
    arrivalName: row.arrival_name,
    prefectureCode: row.prefecture_code,
    latitude: row.latitude,
    longitude: row.longitude,
    startTime: row.start_time,
    endTime: row.end_time,
    durationMinutes: row.duration_minutes,
    category: row.category,
    transportType: row.transport_type,
    carNumber: row.car_number,
    seatNumber: row.seat_number,
    photoUrl: row.photo_url,
  }));

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
        {/* ヘッダー */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">共有された旅行</p>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{trip.title}</h1>
            <Badge variant="secondary">{statusLabels[trip.status]}</Badge>
          </div>
          {trip.description && (
            <p className="text-muted-foreground mt-1">{trip.description}</p>
          )}
          {(trip.start_date || trip.end_date) && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {trip.start_date ?? "未定"} ~ {trip.end_date ?? "未定"}
            </p>
          )}
        </div>

        {/* 行程 */}
        {items.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">行程</h2>
            <ItineraryTimeline
              items={items}
              startDate={trip.start_date}
              readOnly
            />
          </section>
        )}

        {/* 費用サマリー */}
        {expenses.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              費用
            </h2>
            <Card>
              <CardContent className="pt-6 space-y-3">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span>{expense.title}</span>
                      {expense.category && (
                        <Badge variant="outline" className="text-xs">
                          {expenseCategoryLabels[expense.category] ??
                            expense.category}
                        </Badge>
                      )}
                    </div>
                    <span className="font-medium">
                      &yen;{expense.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-3 flex items-center justify-between font-semibold">
                  <span>合計</span>
                  <span>&yen;{totalExpenses.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* フッター */}
        <footer className="text-center text-xs text-muted-foreground pt-4">
          amaneq trip で作成された旅行プラン
        </footer>
      </div>
    </div>
  );
}
