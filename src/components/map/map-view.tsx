"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { JapanHeatmap } from "@/components/map/japan-heatmap";

const PrefectureMap = dynamic(
  () => import("@/components/map/prefecture-map").then((m) => ({ default: m.PrefectureMap })),
  { ssr: false }
);

interface MapViewProps {
  visitCounts: Record<number, number>;
}

export function MapView({ visitCounts }: MapViewProps) {
  const [selectedPrefecture, setSelectedPrefecture] = useState<number | null>(null);

  const visitedCount = Object.keys(visitCounts).length;
  const percentage = Math.round((visitedCount / 47) * 100);

  if (selectedPrefecture) {
    return (
      <PrefectureMap
        prefectureCode={selectedPrefecture}
        onBack={() => setSelectedPrefecture(null)}
      />
    );
  }

  return (
    <>
      <p className="text-muted-foreground">
        訪れた都道府県がヒートマップで表示されます。都道府県をクリックすると詳細マップが表示されます。
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardContent className="p-4">
            <JapanHeatmap
              visitCounts={visitCounts}
              onPrefectureClick={setSelectedPrefecture}
            />
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
    </>
  );
}
