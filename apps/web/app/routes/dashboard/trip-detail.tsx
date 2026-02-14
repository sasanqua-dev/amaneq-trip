import { Link, useParams } from "react-router";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Calendar, MapPin, Receipt, Share2, Edit } from "lucide-react";
import { useSupabase } from "~/lib/supabase";
import { useAppUser } from "~/lib/auth";
import { DeleteTripButton } from "~/components/trips/delete-trip-button";
import {
  getTrip,
  getItineraryItems,
  getExpenses,
  getTripMembers,
} from "@amaneq/core";
import type { TripStatus } from "@amaneq/core";

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

export default function TripDetailPage() {
  const { tripId } = useParams();
  const client = useSupabase();
  const { dbUserId } = useAppUser();
  const [trip, setTrip] = useState<{
    id: string;
    title: string;
    description: string | null;
    status: TripStatus;
    start_date: string | null;
    end_date: string | null;
    owner_id: string;
  } | null>(null);
  const [spotCount, setSpotCount] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [memberCount, setMemberCount] = useState(1);
  const [prefectureCount, setPrefectureCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId || !dbUserId) return;

    Promise.all([
      getTrip(client, tripId),
      getItineraryItems(client, tripId),
      getExpenses(client, tripId),
      getTripMembers(client, tripId),
    ]).then(([tripResult, itemsResult, expensesResult, membersResult]) => {
      if (tripResult.data) {
        setTrip(tripResult.data as typeof trip);
      }

      const items = (itemsResult.data ?? []) as Array<{ prefecture_code: number | null }>;
      setSpotCount(items.length);
      const prefectures = new Set(
        items
          .filter((i) => i.prefecture_code != null)
          .map((i) => i.prefecture_code)
      );
      setPrefectureCount(prefectures.size);

      const expenses = (expensesResult.data ?? []) as Array<{ amount: number }>;
      setTotalExpenses(expenses.reduce((sum, e) => sum + e.amount, 0));

      const members = membersResult.data ?? [];
      setMemberCount(members.length || 1);

      setLoading(false);
    });
  }, [tripId, dbUserId, client]);

  if (loading || !trip) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const perPerson =
    memberCount > 0 ? Math.ceil(totalExpenses / memberCount) : 0;
  const isOwner = trip.owner_id === dbUserId;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
          <Link to={`/trips/${tripId}/share`}>
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              共有
            </Button>
          </Link>
          <Link to={`/trips/${tripId}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              編集
            </Button>
          </Link>
          {isOwner && <DeleteTripButton tripId={tripId!} />}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to={`/trips/${tripId}/itinerary`}>
          <Card className="transition-colors hover:bg-accent/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5" />
                行程
              </CardTitle>
              <CardDescription>日ごとのスケジュールを管理</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{spotCount}</p>
              <p className="text-xs text-muted-foreground">スポット</p>
            </CardContent>
          </Card>
        </Link>

        <Link to={`/trips/${tripId}/expenses`}>
          <Card className="transition-colors hover:bg-accent/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="h-5 w-5" />
                費用
              </CardTitle>
              <CardDescription>旅費の記録と精算</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                &yen;{perPerson.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">1人あたり</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5" />
              訪問先
            </CardTitle>
            <CardDescription>訪れる都道府県</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{prefectureCount}</p>
            <p className="text-xs text-muted-foreground">都道府県</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
