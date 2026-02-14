import { Link } from "react-router";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { useSupabase } from "~/lib/supabase";
import { useAppUser } from "~/lib/auth";
import { getTrips } from "@amaneq/core";
import type { TripStatus } from "@amaneq/core";
import { format } from "date-fns";

type Trip = {
  id: string;
  title: string;
  description: string | null;
  status: TripStatus;
  start_date: string | null;
  end_date: string | null;
};

const statusLabels: Record<TripStatus, string> = {
  draft: "下書き",
  planned: "予定",
  ongoing: "進行中",
  completed: "完了",
};

const statusVariants: Record<TripStatus, "default" | "secondary" | "outline"> = {
  draft: "outline",
  planned: "secondary",
  ongoing: "default",
  completed: "secondary",
};

export default function TripsPage() {
  const client = useSupabase();
  const { dbUserId } = useAppUser();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dbUserId) return;

    getTrips(client).then(({ data }) => {
      if (data) setTrips(data as Trip[]);
      setLoading(false);
    });
  }, [dbUserId, client]);

  const upcoming = trips.filter(
    (t) => t.status === "planned" || t.status === "ongoing"
  );
  const past = trips.filter((t) => t.status === "completed");
  const drafts = trips.filter((t) => t.status === "draft");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const TripList = ({ items }: { items: Trip[] }) =>
    items.length === 0 ? (
      <p className="text-muted-foreground py-8 text-center">
        旅行がありません
      </p>
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((trip) => (
          <Link key={trip.id} to={`/trips/${trip.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{trip.title}</CardTitle>
                  <Badge variant={statusVariants[trip.status]}>
                    {statusLabels[trip.status]}
                  </Badge>
                </div>
                {trip.start_date && (
                  <CardDescription>
                    {format(new Date(trip.start_date), "yyyy/MM/dd")}
                    {trip.end_date &&
                      ` - ${format(new Date(trip.end_date), "yyyy/MM/dd")}`}
                  </CardDescription>
                )}
                {trip.description && (
                  <CardDescription className="line-clamp-2">
                    {trip.description}
                  </CardDescription>
                )}
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">旅行一覧</h1>
        <Link to="/trips/new">
          <Button>
            <Plus className="size-4" />
            新しい旅行
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">予定 ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">過去 ({past.length})</TabsTrigger>
          <TabsTrigger value="draft">下書き ({drafts.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4">
          <TripList items={upcoming} />
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          <TripList items={past} />
        </TabsContent>
        <TabsContent value="draft" className="mt-4">
          <TripList items={drafts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
