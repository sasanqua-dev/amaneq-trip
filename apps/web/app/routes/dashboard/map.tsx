import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { JapanHeatmap } from "~/components/map/japan-heatmap";
import { useSupabase } from "~/lib/supabase";
import { useAppUser } from "~/lib/auth";
import { getPrefectureVisits } from "@amaneq/core";

export default function MapPage() {
  const client = useSupabase();
  const { dbUserId } = useAppUser();
  const [visitCounts, setVisitCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dbUserId) return;

    getPrefectureVisits(client, dbUserId).then(({ data }) => {
      if (data) {
        const counts: Record<number, number> = {};
        for (const row of data as Array<{ prefecture_code: number }>) {
          counts[row.prefecture_code] = (counts[row.prefecture_code] ?? 0) + 1;
        }
        setVisitCounts(counts);
      }
      setLoading(false);
    });
  }, [dbUserId, client]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const visitedCount = Object.keys(visitCounts).length;
  const percentage = Math.round((visitedCount / 47) * 100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">訪問マップ</h1>

      <p className="text-muted-foreground">
        訪れた都道府県がヒートマップで表示されます。
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardContent className="p-4">
            <JapanHeatmap visitCounts={visitCounts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>統計</CardTitle>
            <CardDescription>あなたの訪問記録</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">訪問済み</p>
              <p className="text-3xl font-bold">{visitedCount} / 47</p>
              <p className="text-xs text-muted-foreground">都道府県</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">制覇率</p>
              <div className="mt-1 h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{percentage}%</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
