"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ArrowRight,
  Clock,
  ArrowLeftRight,
  Train,
  Bus,
  Ship,
  Footprints,
  Loader2,
  Plus,
  Check,
  ChevronDown,
  JapaneseYen,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlaceAutocomplete } from "@/components/ui/place-autocomplete";
import {
  searchTransitRoutes,
  addTransitRouteToItinerary,
} from "@/lib/actions/train-search";
import { sortLinkedList } from "@/lib/utils/linked-list";
import type { TransitRoute, TransitStep } from "@/lib/types/train-search";
import type { ItineraryItem } from "@/lib/types/itinerary";

interface TrainSearchModalProps {
  tripId: string;
  maxDay: number;
  items: ItineraryItem[];
  startDate: string | null;
}

const FIRST_SENTINEL = "__first__";

const transitTypes = [
  "train_station",
  "subway_station",
  "bus_station",
  "transit_station",
];

const vehicleIcons: Record<string, LucideIcon> = {
  HIGH_SPEED_TRAIN: Train,
  HEAVY_RAIL: Train,
  COMMUTER_TRAIN: Train,
  RAIL: Train,
  SUBWAY: Train,
  LIGHT_RAIL: Train,
  MONORAIL: Train,
  TRAM: Train,
  BUS: Bus,
  INTERCITY_BUS: Bus,
  TROLLEYBUS: Bus,
  FERRY: Ship,
  WALKING: Footprints,
};

function getVehicleIcon(vehicleType: string): LucideIcon {
  return vehicleIcons[vehicleType] ?? Train;
}

function formatMinutes(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}時間${m}分` : `${h}時間`;
  }
  return `${minutes}分`;
}

function formatDate(startDate: string, dayNumber: number): string {
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayNumber - 1);
  return date.toISOString().slice(0, 10);
}

// --- Route card with JR East app-style timeline ---

function RouteCard({
  route,
  onAdd,
  adding,
  added,
}: {
  route: TransitRoute;
  onAdd: () => void;
  adding: boolean;
  added: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const transitSteps = route.steps.filter((s) => s.type === "transit");

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      {/* Header: departure → arrival summary */}
      <button
        type="button"
        className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-lg font-bold tabular-nums whitespace-nowrap">
              {route.departureTime}
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-lg font-bold tabular-nums whitespace-nowrap">
              {route.arrivalTime}
            </span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-180"
            )}
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatMinutes(route.durationMinutes)}
          </span>
          {route.transfers > 0 && (
            <span className="flex items-center gap-1">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              乗換{route.transfers}回
            </span>
          )}
          {route.fareText && (
            <span className="flex items-center gap-1">
              <JapaneseYen className="h-3.5 w-3.5" />
              {route.fareText}
            </span>
          )}
        </div>

        {/* Line badges */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {transitSteps.map((step, i) => (
            <span key={i}>
              {i > 0 && (
                <ArrowRight className="inline h-3 w-3 mx-0.5 text-muted-foreground align-middle" />
              )}
              <span
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: step.lineColor }}
              >
                {(() => {
                  const Icon = getVehicleIcon(step.vehicleType);
                  return <Icon className="h-3 w-3" />;
                })()}
                {step.lineShortName || step.lineName}
              </span>
            </span>
          ))}
        </div>
      </button>

      {/* Expanded: step-by-step timeline */}
      {expanded && (
        <div className="border-t px-4 py-3">
          <RouteTimeline steps={route.steps} />

          <div className="mt-3 flex justify-end">
            <Button
              size="sm"
              disabled={adding || added}
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
            >
              {added ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  追加済み
                </>
              ) : adding ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  追加中...
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  行程に追加
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function RouteTimeline({ steps }: { steps: TransitStep[] }) {
  return (
    <div className="relative">
      {steps.map((step, index) => {
        if (step.type === "walking") {
          return (
            <div key={index} className="flex items-center gap-3 py-1.5">
              <div className="w-14 shrink-0" />
              <div className="mx-1 flex justify-center w-5">
                <div className="w-0.5 h-6 border-l-2 border-dashed border-gray-300" />
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Footprints className="h-3 w-3" />
                徒歩 {formatMinutes(step.durationMinutes)}
              </span>
            </div>
          );
        }

        const Icon = getVehicleIcon(step.vehicleType);
        const isLast = index === steps.length - 1 ||
          steps.slice(index + 1).every((s) => s.type === "walking");

        return (
          <div key={index}>
            {/* Departure */}
            <div className="flex items-start gap-3">
              <div className="w-14 shrink-0 text-right">
                <span className="text-sm font-semibold tabular-nums">
                  {step.departureTime}
                </span>
              </div>
              <div className="mx-1 flex flex-col items-center">
                <div
                  className="h-5 w-5 rounded-full border-2 bg-white flex items-center justify-center shrink-0"
                  style={{ borderColor: step.lineColor }}
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: step.lineColor }}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0 -mt-0.5">
                <span className="text-sm font-medium">{step.departureStop}</span>
              </div>
            </div>

            {/* Line connector */}
            <div className="flex items-stretch gap-3">
              <div className="w-14 shrink-0" />
              <div className="mx-1 flex justify-center w-5">
                <div
                  className="w-1 min-h-10"
                  style={{ backgroundColor: step.lineColor }}
                />
              </div>
              <div className="flex-1 min-w-0 py-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: step.lineColor }}
                  >
                    <Icon className="h-3 w-3" />
                    {step.lineName}
                    {step.lineShortName && ` ${step.lineShortName}`}
                  </span>
                  {step.headsign && (
                    <span className="text-xs text-muted-foreground">
                      {step.headsign}方面
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {step.numStops}駅 {formatMinutes(step.durationMinutes)}
                </div>
              </div>
            </div>

            {/* Arrival */}
            <div className="flex items-start gap-3">
              <div className="w-14 shrink-0 text-right">
                <span className="text-sm font-semibold tabular-nums">
                  {step.arrivalTime}
                </span>
              </div>
              <div className="mx-1 flex flex-col items-center">
                <div
                  className="h-5 w-5 rounded-full border-2 bg-white flex items-center justify-center shrink-0"
                  style={{ borderColor: step.lineColor }}
                >
                  {isLast ? (
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: step.lineColor }}
                    />
                  ) : (
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: step.lineColor }}
                    />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0 -mt-0.5">
                <span className="text-sm font-medium">{step.arrivalStop}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Main modal ---

export function TrainSearchModal({
  tripId,
  maxDay,
  items,
  startDate,
}: TrainSearchModalProps) {
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedDay, setSelectedDay] = useState("1");
  const [departureTimeInput, setDepartureTimeInput] = useState("08:00");
  const [routes, setRoutes] = useState<TransitRoute[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [addingRouteIndex, setAddingRouteIndex] = useState<number | null>(null);
  const [addedRouteIndices, setAddedRouteIndices] = useState<Set<number>>(
    new Set()
  );

  const [selectedPrevItemId, setSelectedPrevItemId] = useState(FIRST_SENTINEL);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const dayItems = useMemo(() => {
    const filtered = (items ?? []).filter(
      (i) => i.dayNumber === Number(selectedDay)
    );
    return sortLinkedList(filtered);
  }, [items, selectedDay]);

  // Default to end of day's items
  useEffect(() => {
    setSelectedPrevItemId(
      dayItems.length > 0 ? dayItems[dayItems.length - 1].id : FIRST_SENTINEL
    );
  }, [dayItems]);

  const buildDepartureUnix = useCallback(
    (timeStr: string, offsetMinutes = 0) => {
      let dateStr: string;
      if (startDate) {
        dateStr = formatDate(startDate, Number(selectedDay));
      } else {
        dateStr = new Date().toISOString().slice(0, 10);
      }
      const [h, m] = timeStr.split(":").map(Number);
      const d = new Date(`${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+09:00`);
      d.setMinutes(d.getMinutes() + offsetMinutes);
      return Math.floor(d.getTime() / 1000);
    },
    [startDate, selectedDay]
  );

  const handleSearch = useCallback(async () => {
    if (!origin.trim() || !destination.trim()) return;

    setSearching(true);
    setSearchError(null);
    setHasSearched(true);
    setRoutes([]);
    setHasMore(true);
    setAddedRouteIndices(new Set());

    const departureUnix = buildDepartureUnix(departureTimeInput);
    const result = await searchTransitRoutes(
      origin,
      destination,
      departureUnix
    );

    setSearching(false);
    if (result.error) {
      setSearchError(result.error);
      return;
    }
    setRoutes(result.routes);
    if (result.routes.length === 0) {
      setHasMore(false);
    }
  }, [origin, destination, departureTimeInput, buildDepartureUnix]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || routes.length === 0) return;

    setLoadingMore(true);
    const lastRoute = routes[routes.length - 1];
    // Request routes departing 1 minute after the last result
    const nextDepartureUnix = lastRoute.departureTimeUnix + 60;

    const result = await searchTransitRoutes(
      origin,
      destination,
      nextDepartureUnix
    );

    setLoadingMore(false);
    if (result.error || result.routes.length === 0) {
      setHasMore(false);
      return;
    }

    // Filter out duplicates
    const existingKeys = new Set(
      routes.map((r) => `${r.departureTime}-${r.arrivalTime}`)
    );
    const newRoutes = result.routes.filter(
      (r) => !existingKeys.has(`${r.departureTime}-${r.arrivalTime}`)
    );

    if (newRoutes.length === 0) {
      setHasMore(false);
      return;
    }

    setRoutes((prev) => [...prev, ...newRoutes]);
  }, [loadingMore, hasMore, routes, origin, destination]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!hasSearched || !hasMore || routes.length === 0) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { root: scrollContainerRef.current, threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasSearched, hasMore, routes.length, loadMore]);

  const handleAdd = useCallback(
    async (route: TransitRoute, routeIndex: number) => {
      setAddingRouteIndex(routeIndex);
      try {
        const prevId =
          selectedPrevItemId === FIRST_SENTINEL ? null : selectedPrevItemId;
        await addTransitRouteToItinerary(
          tripId,
          Number(selectedDay),
          prevId,
          route
        );
        setAddedRouteIndices((prev) => new Set(prev).add(routeIndex));
      } catch {
        // Error handled silently
      } finally {
        setAddingRouteIndex(null);
      }
    },
    [tripId, selectedDay, selectedPrevItemId]
  );

  const handleSwap = useCallback(() => {
    setOrigin((prev) => {
      const prevDest = destination;
      setDestination(prev);
      return prevDest;
    });
  }, [destination]);

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      setRoutes([]);
      setHasSearched(false);
      setSearchError(null);
      setAddedRouteIndices(new Set());
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Search className="mr-2 h-4 w-4" />
          経路検索
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] flex-col p-0 sm:max-w-lg">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>経路検索</DialogTitle>
        </DialogHeader>

        {/* Search form */}
        <div className="space-y-4 px-6 pb-4 border-b">
          {/* Station inputs */}
          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="search-origin">出発駅</Label>
                <PlaceAutocomplete
                  id="search-origin"
                  value={origin}
                  onChange={setOrigin}
                  onPlaceSelect={(place) => setOrigin(place.name)}
                  placeholder="例: 東京駅"
                  includedPrimaryTypes={transitTypes}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 mb-0.5"
                onClick={handleSwap}
                title="出発地と到着地を入れ替え"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
              <div className="flex-1 space-y-2">
                <Label htmlFor="search-destination">到着駅</Label>
                <PlaceAutocomplete
                  id="search-destination"
                  value={destination}
                  onChange={setDestination}
                  onPlaceSelect={(place) => setDestination(place.name)}
                  placeholder="例: 京都駅"
                  includedPrimaryTypes={transitTypes}
                />
              </div>
            </div>
          </div>

          {/* Day + Time + Insertion position */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>日目</Label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    { length: Math.max(maxDay, 1) + 1 },
                    (_, i) => i + 1
                  ).map((day) => (
                    <SelectItem key={day} value={String(day)}>
                      Day {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search-time">出発時刻</Label>
              <Input
                id="search-time"
                type="time"
                value={departureTimeInput}
                onChange={(e) => setDepartureTimeInput(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>挿入位置</Label>
              <Select
                value={selectedPrevItemId}
                onValueChange={setSelectedPrevItemId}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FIRST_SENTINEL}>先頭</SelectItem>
                  {dayItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title} の後
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            className="w-full"
            disabled={searching || !origin.trim() || !destination.trim()}
            onClick={handleSearch}
          >
            {searching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            検索
          </Button>
        </div>

        {/* Results */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto min-h-0 px-6 py-4"
        >
          {searchError && (
            <p className="text-sm text-destructive text-center py-8">
              {searchError}
            </p>
          )}

          {hasSearched && !searching && !searchError && routes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              該当する経路が見つかりませんでした
            </p>
          )}

          {routes.length > 0 && (
            <div className="space-y-3 pb-2">
              {routes.map((route, index) => (
                <RouteCard
                  key={`${route.departureTime}-${route.arrivalTime}-${index}`}
                  route={route}
                  onAdd={() => handleAdd(route, index)}
                  adding={addingRouteIndex === index}
                  added={addedRouteIndices.has(index)}
                />
              ))}

              {/* Infinite scroll sentinel */}
              {hasMore && (
                <div
                  ref={sentinelRef}
                  className="flex justify-center py-4"
                >
                  {loadingMore && (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  )}
                </div>
              )}

              {!hasMore && routes.length > 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  これ以上の候補はありません
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
