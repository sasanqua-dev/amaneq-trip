import { useState } from "react";
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
import { useAppUser } from "~/lib/auth";
import { createExpense } from "@amaneq/core";

interface ExpenseFormProps {
  tripId: string;
  onCreated?: () => void;
}

export function ExpenseForm({ tripId, onCreated }: ExpenseFormProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const client = useSupabase();
  const { dbUserId } = useAppUser();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!dbUserId) return;
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    await createExpense(client, {
      trip_id: tripId,
      title: form.get("title") as string,
      amount: parseInt(form.get("amount") as string, 10),
      category: (form.get("category") as string) || null,
      paid_by: dbUserId,
    });
    setSubmitting(false);
    setOpen(false);
    onCreated?.();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          費用を追加
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>費用を追加</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense-title">項目名</Label>
            <Input
              id="expense-title"
              name="title"
              placeholder="例: 新幹線（東京→京都）"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-amount">金額（円）</Label>
            <Input
              id="expense-amount"
              name="amount"
              type="number"
              min="0"
              placeholder="13320"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-category">カテゴリ</Label>
            <Select name="category" defaultValue="other">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transport">交通</SelectItem>
                <SelectItem value="accommodation">宿泊</SelectItem>
                <SelectItem value="food">食事</SelectItem>
                <SelectItem value="ticket">チケット</SelectItem>
                <SelectItem value="shopping">買い物</SelectItem>
                <SelectItem value="other">その他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "追加中..." : "追加する"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
