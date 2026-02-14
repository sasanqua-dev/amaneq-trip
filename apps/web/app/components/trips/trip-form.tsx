import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useSupabase } from "~/lib/supabase";
import { useAppUser } from "~/lib/auth";
import {
  createTrip,
  updateTrip,
  addTripMember,
} from "@amaneq/core";
import type { TripStatus } from "@amaneq/core";

interface TripFormProps {
  tripId?: string;
  defaultValues?: {
    title: string;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
    status: TripStatus;
  };
}

export function TripForm({ tripId, defaultValues }: TripFormProps) {
  const navigate = useNavigate();
  const client = useSupabase();
  const { dbUserId } = useAppUser();
  const isEditing = !!tripId;
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!dbUserId) return;
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const title = form.get("title") as string;
    const description = (form.get("description") as string) || null;
    const startDate = (form.get("startDate") as string) || null;
    const endDate = (form.get("endDate") as string) || null;
    const status = (form.get("status") as TripStatus) || "draft";

    try {
      if (isEditing) {
        await updateTrip(client, tripId, {
          title,
          description,
          start_date: startDate,
          end_date: endDate,
          status,
        });
        navigate(`/trips/${tripId}`);
      } else {
        const { data } = await createTrip(client, {
          owner_id: dbUserId,
          title,
          description,
          start_date: startDate,
          end_date: endDate,
          status,
        });
        if (data) {
          await addTripMember(client, {
            trip_id: data.id,
            user_id: dbUserId,
            role: "owner",
          });
          navigate(`/trips/${data.id}`);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">旅行タイトル</Label>
        <Input
          id="title"
          name="title"
          placeholder="例: 京都・大阪旅行"
          defaultValue={defaultValues?.title ?? ""}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">説明</Label>
        <textarea
          id="description"
          name="description"
          className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="旅行の概要や目的を入力"
          defaultValue={defaultValues?.description ?? ""}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">開始日</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={defaultValues?.startDate ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">終了日</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={defaultValues?.endDate ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">ステータス</Label>
        <Select name="status" defaultValue={defaultValues?.status ?? "draft"}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">下書き</SelectItem>
            <SelectItem value="planned">計画中</SelectItem>
            <SelectItem value="ongoing">旅行中</SelectItem>
            <SelectItem value="completed">完了</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "保存中..." : isEditing ? "更新する" : "作成する"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(-1)}
        >
          キャンセル
        </Button>
      </div>
    </form>
  );
}
