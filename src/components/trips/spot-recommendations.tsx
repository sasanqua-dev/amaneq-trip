"use client";

import { useState } from "react";
import { Sparkles, Loader2, MapPin, ExternalLink, X, Plus, Check } from "lucide-react";
import { WalkIcon, BicycleIcon, CarIcon, BulletTrainIcon } from "@/components/icons/transport-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getSpotRecommendations,
  type Recommendation,
} from "@/lib/actions/recommendations";
import { addRecommendationToTimeline } from "@/lib/actions/itinerary";

interface SpotRecommendationsProps {
  spotName: string;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  tripId?: string;
  dayNumber?: number;
  parentItemId?: string;
  readOnly?: boolean;
}

const categoryColors: Record<string, string> = {
  グルメ: "bg-orange-100 text-orange-700",
  カフェ: "bg-amber-100 text-amber-700",
  観光: "bg-emerald-100 text-emerald-700",
  ショッピング: "bg-pink-100 text-pink-700",
  体験: "bg-blue-100 text-blue-700",
  "温泉・リラクゼーション": "bg-purple-100 text-purple-700",
};

function getGoogleMapsSearchUrl(name: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
}

export function SpotRecommendations({
  spotName,
  locationName,
  latitude,
  longitude,
  tripId,
  dayNumber,
  parentItemId,
  readOnly,
}: SpotRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const [addedIndices, setAddedIndices] = useState<Set<number>>(new Set());
  const canAdd = !!tripId && dayNumber != null && !readOnly;

  async function handleFetch() {
    if (open && recommendations.length > 0) {
      setOpen(false);
      return;
    }

    setLoading(true);
    setError(null);
    setOpen(true);

    const result = await getSpotRecommendations(
      spotName,
      locationName,
      latitude,
      longitude
    );

    if (result.error) {
      setError(result.error);
    } else {
      setRecommendations(result.recommendations);
    }

    setLoading(false);
  }

  async function handleAdd(rec: Recommendation, index: number) {
    if (!tripId || dayNumber == null) return;
    setAddingIndex(index);
    try {
      await addRecommendationToTimeline(
        tripId,
        dayNumber,
        parentItemId ?? null,
        rec.name,
        rec.category,
        rec.description
      );
      setAddedIndices((prev: Set<number>) => new Set(prev).add(index));
    } catch {
      // silently ignore – the user can retry
    } finally {
      setAddingIndex(null);
    }
  }

  return (
    <div className="mt-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 px-2"
        onClick={handleFetch}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        {loading ? "取得中..." : open && recommendations.length > 0 ? "閉じる" : "周辺のおすすめ"}
      </Button>

      {open && (
        <div className="mt-2 rounded-lg border border-violet-100 bg-violet-50/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-violet-800 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {spotName} 周辺のおすすめ
            </h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-violet-400 hover:text-violet-600"
              onClick={() => setOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          {loading && (
            <div className="flex items-center gap-2 py-4 justify-center text-xs text-violet-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Gemini がおすすめを探しています...
            </div>
          )}

          {!loading && !error && recommendations.length > 0 && (
            <ul className="space-y-2">
              {recommendations.map((rec, i) => (
                <li
                  key={i}
                  className="rounded-md bg-white border border-violet-100 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium leading-snug">
                          {rec.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0 h-4 ${categoryColors[rec.category] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {rec.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {rec.description}
                      </p>
                      <p className="text-xs text-violet-600 mt-0.5">
                        {rec.reason}
                      </p>
                      {rec.travelTime && (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500">
                            <WalkIcon className="h-3 w-3" />
                            {rec.travelTime.walk}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500">
                            <BicycleIcon className="h-3 w-3" />
                            {rec.travelTime.bicycle}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500">
                            <CarIcon className="h-3 w-3" />
                            {rec.travelTime.car}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500">
                            <BulletTrainIcon className="h-3 w-3" />
                            {rec.travelTime.transit}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 mt-0.5">
                      {canAdd && (
                        addedIndices.has(i) ? (
                          <span className="flex items-center gap-0.5 text-[10px] text-emerald-600">
                            <Check className="h-3 w-3" />
                            追加済
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 gap-0.5 px-1.5 text-[10px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            disabled={addingIndex === i}
                            onClick={() => handleAdd(rec, i)}
                          >
                            {addingIndex === i ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                            追加
                          </Button>
                        )
                      )}
                      <a
                        href={getGoogleMapsSearchUrl(rec.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-[10px] text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <MapPin className="h-3 w-3" />
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!loading && !error && recommendations.length === 0 && (
            <p className="text-xs text-muted-foreground py-2 text-center">
              おすすめが見つかりませんでした
            </p>
          )}
        </div>
      )}
    </div>
  );
}
