"use client";

import { useState, useMemo } from "react";
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
import { Train } from "lucide-react";
import { PlaceAutocomplete } from "@/components/ui/place-autocomplete";
import { createItineraryItem, updateItineraryItem } from "@/lib/actions/itinerary";
import { sortLinkedList } from "@/lib/utils/linked-list";
import type { ItineraryItem } from "@/lib/types/itinerary";

interface TransportFormProps {
  tripId: string;
  maxDay: number;
  items?: ItineraryItem[];
  editItem?: ItineraryItem;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const FIRST_SENTINEL = "__first__";

const transportTypeLabels: Record<string, string> = {
  shinkansen: "新幹線",
  express: "特急",
  local_train: "在来線",
  bus: "バス",
  ship: "船",
  airplane: "飛行機",
  car: "車",
  taxi: "タクシー",
  walk: "徒歩",
  bicycle: "自転車",
  other: "その他",
};

export function TransportForm({ tripId, maxDay, items, editItem, open: controlledOpen, onOpenChange }: TransportFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;

  const [selectedDay, setSelectedDay] = useState(String(editItem?.dayNumber ?? 1));
  const [departureName, setDepartureName] = useState(editItem?.departureName ?? "");
  const [arrivalName, setArrivalName] = useState(editItem?.arrivalName ?? "");
  const [timeMode, setTimeMode] = useState<"clock" | "duration">(
    editItem?.durationMinutes ? "duration" : "clock"
  );

  const transitTypes = [
    "train_station",
    "subway_station",
    "bus_station",
    "airport",
    "transit_station",
  ];

  const dayItems = useMemo(() => {
    const filtered = (items ?? [])
      .filter((i) => i.dayNumber === Number(selectedDay))
      .filter((i) => (editItem ? i.id !== editItem.id : true));
    return sortLinkedList(filtered);
  }, [items, selectedDay, editItem]);

  const defaultPrevItemId = useMemo(() => {
    if (editItem) return editItem.prevItemId ?? FIRST_SENTINEL;
    return dayItems.length > 0 ? dayItems[dayItems.length - 1].id : FIRST_SENTINEL;
  }, [editItem, dayItems]);

  const [selectedPrevItemId, setSelectedPrevItemId] = useState(defaultPrevItemId);
  const [formKey, setFormKey] = useState(0);

  function resetForm() {
    setSelectedDay("1");
    setDepartureName("");
    setArrivalName("");
    setTimeMode("clock");
    const filtered = (items ?? []).filter((i) => i.dayNumber === 1);
    const sorted = sortLinkedList(filtered);
    setSelectedPrevItemId(sorted.length > 0 ? sorted[sorted.length - 1].id : FIRST_SENTINEL);
    setFormKey((k) => k + 1);
  }

  function handleDialogOpenChange(newOpen: boolean) {
    if (!newOpen) {
      resetForm();
    }
    setOpen(newOpen);
  }

  const handleDayChange = (day: string) => {
    setSelectedDay(day);
    const filtered = (items ?? [])
      .filter((i) => i.dayNumber === Number(day))
      .filter((i) => (editItem ? i.id !== editItem.id : true));
    const sorted = sortLinkedList(filtered);
    if (editItem && Number(day) === editItem.dayNumber) {
      setSelectedPrevItemId(editItem.prevItemId ?? FIRST_SENTINEL);
    } else {
      setSelectedPrevItemId(sorted.length > 0 ? sorted[sorted.length - 1].id : FIRST_SENTINEL);
    }
  };

  async function handleSubmit(formData: FormData) {
    formData.set("tripId", tripId);
    formData.set("category", "transport");
    formData.set("prevItemId", selectedPrevItemId);
    formData.set("departureName", departureName);
    formData.set("arrivalName", arrivalName);
    if (timeMode === "duration") {
      const h = parseInt(formData.get("durationHours") as string, 10) || 0;
      const m = parseInt(formData.get("durationMins") as string, 10) || 0;
      const total = h * 60 + m;
      if (total > 0) formData.set("durationMinutes", String(total));
      formData.delete("startTime");
      formData.delete("endTime");
    }
    if (editItem) {
      formData.set("itemId", editItem.id);
      await updateItineraryItem(formData);
    } else {
      await createItineraryItem(formData);
    }
    handleDialogOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline">
            <Train className="mr-2 h-4 w-4" />
            移動を追加
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editItem ? "移動を編集" : "移動を追加"}</DialogTitle>
        </DialogHeader>
        <form key={editItem?.id ?? `new-${formKey}`} action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transport-title">タイトル</Label>
            <Input
              id="transport-title"
              name="title"
              placeholder="例: のぞみ123号"
              defaultValue={editItem?.title ?? ""}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="transport-departure">出発地</Label>
              <PlaceAutocomplete
                id="transport-departure"
                value={departureName}
                onChange={setDepartureName}
                onPlaceSelect={(place) => setDepartureName(place.name)}
                placeholder="例: 東京駅"
                includedPrimaryTypes={transitTypes}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transport-arrival">到着地</Label>
              <PlaceAutocomplete
                id="transport-arrival"
                value={arrivalName}
                onChange={setArrivalName}
                onPlaceSelect={(place) => setArrivalName(place.name)}
                placeholder="例: 京都駅"
                includedPrimaryTypes={transitTypes}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="transport-type">移動手段</Label>
              <Select name="transportType" defaultValue={editItem?.transportType ?? "shinkansen"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(transportTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transport-day">日目</Label>
              <Select name="dayNumber" value={selectedDay} onValueChange={handleDayChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: Math.max(maxDay, 1) + 1 }, (_, i) => i + 1).map(
                    (day) => (
                      <SelectItem key={day} value={String(day)}>
                        Day {day}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>挿入位置</Label>
            <Select value={selectedPrevItemId} onValueChange={setSelectedPrevItemId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FIRST_SENTINEL}>先頭に配置</SelectItem>
                {dayItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.title} の後
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="transport-car">号車</Label>
              <Input
                id="transport-car"
                name="carNumber"
                placeholder="例: 7"
                defaultValue={editItem?.carNumber ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transport-seat">座席番号</Label>
              <Input
                id="transport-seat"
                name="seatNumber"
                placeholder="例: 12A"
                defaultValue={editItem?.seatNumber ?? ""}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label>時間の指定方法</Label>
              <div className="inline-flex rounded-md border text-sm">
                <button
                  type="button"
                  className={`px-3 py-1 rounded-l-md transition-colors ${timeMode === "clock" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  onClick={() => setTimeMode("clock")}
                >
                  時刻
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded-r-md transition-colors ${timeMode === "duration" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  onClick={() => setTimeMode("duration")}
                >
                  所要時間
                </button>
              </div>
            </div>
            {timeMode === "clock" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="transport-start">出発時刻</Label>
                  <Input
                    id="transport-start"
                    name="startTime"
                    type="time"
                    defaultValue={editItem?.startTime?.slice(0, 5) ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transport-end">到着時刻</Label>
                  <Input
                    id="transport-end"
                    name="endTime"
                    type="time"
                    defaultValue={editItem?.endTime?.slice(0, 5) ?? ""}
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="transport-duration-h">時間</Label>
                  <Select name="durationHours" defaultValue={editItem?.durationMinutes ? String(Math.floor(editItem.durationMinutes / 60)) : "0"}>
                    <SelectTrigger id="transport-duration-h">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 13 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>{i}時間</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transport-duration-m">分</Label>
                  <Select name="durationMins" defaultValue={editItem?.durationMinutes ? String(editItem.durationMinutes % 60) : "30"}>
                    <SelectTrigger id="transport-duration-m">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 5, 10, 15, 20, 30, 40, 45, 50].map((m) => (
                        <SelectItem key={m} value={String(m)}>{m}分</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transport-description">メモ</Label>
            <textarea
              id="transport-description"
              name="description"
              className="flex min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="乗り換え情報やメモなど"
              defaultValue={editItem?.description ?? ""}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button type="submit">{editItem ? "保存する" : "追加する"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
