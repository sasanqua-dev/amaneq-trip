import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";
import { TripCard } from "@/components/trips/trip-card";
import { ensureUser } from "@/lib/auth0";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type TripRow = Database["public"]["Tables"]["trips"]["Row"];
type TripMemberRow = Database["public"]["Tables"]["trip_members"]["Row"];

export default async function TripsPage() {
  const user = await ensureUser();
  if (!user) return null;

  const supabase = createServerClient();

  const { data: memberData } = await supabase
    .from("trip_members")
    .select()
    .eq("user_id", user.dbId);

  const memberRows = (memberData ?? []) as TripMemberRow[];
  const tripIds = memberRows.map((m) => m.trip_id);

  const { data: trips } = tripIds.length > 0
    ? await supabase
        .from("trips")
        .select()
        .in("id", tripIds)
        .order("created_at", { ascending: false })
    : { data: [] as TripRow[] };

  const allTrips = (trips ?? []) as TripRow[];
  const upcoming = allTrips.filter((t) => t.status === "planned" || t.status === "ongoing");
  const past = allTrips.filter((t) => t.status === "completed");
  const draft = allTrips.filter((t) => t.status === "draft");

  function renderTrips(list: typeof allTrips, emptyMessage: string) {
    if (list.length === 0) {
      return <p className="text-muted-foreground">{emptyMessage}</p>;
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((trip) => (
          <TripCard
            key={trip.id}
            id={trip.id}
            title={trip.title}
            description={trip.description}
            status={trip.status}
            startDate={trip.start_date}
            endDate={trip.end_date}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">旅行一覧</h1>
        <Link href="/trips/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            新しい旅行
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">予定 ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">過去 ({past.length})</TabsTrigger>
          <TabsTrigger value="draft">下書き ({draft.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4">
          {renderTrips(upcoming, "予定の旅行はまだありません。")}
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          {renderTrips(past, "過去の旅行はまだありません。")}
        </TabsContent>
        <TabsContent value="draft" className="mt-4">
          {renderTrips(draft, "下書きの旅行はまだありません。")}
        </TabsContent>
      </Tabs>
    </div>
  );
}
