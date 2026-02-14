import { useState, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { PlusCircle } from "lucide-react";
import { useSupabase } from "~/lib/supabase";
import { createItineraryItem, updateItineraryItem, moveItineraryItem } from "@amaneq/core";
import { PREFECTURES } from "~/lib/constants/prefectures";
import { sortLinkedList } from "~/lib/utils/linked-list";
import type { ItineraryItem } from "~/lib/types/itinerary";

interface ItineraryFormProps {
  tripId: string;
  maxDay: number;
  items?: ItineraryItem[];
  editItem?: ItineraryItem;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const FIRST_SENTINEL = "__first__";
const NO_PREFECTURE = "__none__";

export function ItineraryForm({ tripId, maxDay, items, editItem, open: controlledOpen, onOpenChange }: ItineraryFormProps) {
  const client = useSupabase();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;

  const [selectedDay, setSelectedDay] = useState(String(editItem?.dayNumber ?? 1));
  const [timeMode, setTimeMode] = useState<"clock" | "duration">(
    editItem?.durationMinutes ? "duration" : "clock"
  );
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState(editItem?.title ?? "");
  const [locationName, setLocationName] = useState(editItem?.locationName ?? "");
  const [prefectureCode, setPrefectureCode] = useState(
    editItem?.prefectureCode ? String(editItem.prefectureCode) : NO_PREFECTURE
  );
  const [formKey, setFormKey] = useState(0);

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

  function resetForm() {
    setTitle("");
    setLocationName("");
    setPrefectureCode(NO_PREFECTURE);
    setSelectedDay("1");
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const category = formData.get("category") as string;
    const prevItemId = selectedPrevItemId === FIRST_SENTINEL ? null : selectedPrevItemId;

    let startTime: string | null = null;
    let endTime: string | null = null;
    let durationMinutes: number | null = null;

    if (timeMode === "clock") {
      startTime = (formData.get("startTime") as string) || null;
      endTime = (formData.get("endTime") as string) || null;
    } else {
      const h = parseInt(formData.get("durationHours") as string, 10) || 0;
      const m = parseInt(formData.get("durationMins") as string, 10) || 0;
      const total = h * 60 + m;
      if (total > 0) durationMinutes = total;
    }

    const description = (formData.get("description") as string) || null;
    const prefCode = prefectureCode === NO_PREFECTURE ? null : Number(prefectureCode);

    try {
      if (editItem) {
        // Check if position changed
        const positionChanged =
          Number(selectedDay) !== editItem.dayNumber ||
          prevItemId !== editItem.prevItemId;

        if (positionChanged) {
          await moveItineraryItem(client, {
            p_item_id: editItem.id,
            p_new_day_number: Number(selectedDay),
            p_new_prev_item_id: prevItemId,
          });
        }

        await updateItineraryItem(client, editItem.id, {
          title,
          description,
          location_name: locationName || null,
          prefecture_code: prefCode,
          start_time: startTime,
          end_time: endTime,
          duration_minutes: durationMinutes,
          category,
        });
      } else {
        await createItineraryItem(client, {
          p_trip_id: tripId,
          p_day_number: Number(selectedDay),
          p_prev_item_id: prevItemId,
          p_title: title,
          p_description: description,
          p_location_name: locationName || null,
          p_departure_name: null,
          p_arrival_name: null,
          p_prefecture_code: prefCode,
          p_latitude: null,
          p_longitude: null,
          p_start_time: startTime,
          p_end_time: endTime,
          p_duration_minutes: durationMinutes,
          p_category: category,
          p_transport_type: null,
          p_car_number: null,
          p_seat_number: null,
          p_photo_url: null,
          p_google_place_id: null,
        });
      }
      handleDialogOpenChange(false);
    } catch (err) {
      console.error("Failed to save itinerary item:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            スポットを追加
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editItem ? "スポットを編集" : "スポットを追加"}</DialogTitle>
        </DialogHeader>
        <form key={editItem?.id ?? `new-${formKey}`} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-title">スポット名</Label>
            <Input
              id="item-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 清水寺"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-location">住所</Label>
            <Input
              id="item-location"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="例: 京都府京都市東山区清水1丁目294"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="item-day">日目</Label>
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

            <div className="space-y-2">
              <Label htmlFor="item-category">カテゴリ</Label>
              <Select name="category" defaultValue={editItem?.category ?? "sightseeing"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sightseeing">観光</SelectItem>
                  <SelectItem value="meal">食事</SelectItem>
                  <SelectItem value="accommodation">宿泊</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
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

          <div className="space-y-2">
            <Label htmlFor="item-prefecture">都道府県</Label>
            <Select value={prefectureCode} onValueChange={setPrefectureCode}>
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PREFECTURE}>選択してください</SelectItem>
                {PREFECTURES.map((pref) => (
                  <SelectItem key={pref.code} value={String(pref.code)}>
                    {pref.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  <Label htmlFor="item-start">開始時刻</Label>
                  <Input
                    id="item-start"
                    name="startTime"
                    type="time"
                    defaultValue={editItem?.startTime?.slice(0, 5) ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-end">終了時刻</Label>
                  <Input
                    id="item-end"
                    name="endTime"
                    type="time"
                    defaultValue={editItem?.endTime?.slice(0, 5) ?? ""}
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="item-duration-h">時間</Label>
                  <Select name="durationHours" defaultValue={editItem?.durationMinutes ? String(Math.floor(editItem.durationMinutes / 60)) : "0"}>
                    <SelectTrigger id="item-duration-h">
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
                  <Label htmlFor="item-duration-m">分</Label>
                  <Select name="durationMins" defaultValue={editItem?.durationMinutes ? String(editItem.durationMinutes % 60) : "30"}>
                    <SelectTrigger id="item-duration-m">
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
            <Label htmlFor="item-description">メモ</Label>
            <textarea
              id="item-description"
              name="description"
              className="flex min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="メモや詳細情報"
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
            <Button type="submit" disabled={submitting}>
              {submitting ? "保存中..." : editItem ? "保存する" : "追加する"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
