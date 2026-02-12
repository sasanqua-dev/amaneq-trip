"use client";

import { useState } from "react";
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
import { PlusCircle } from "lucide-react";
import { createExpense } from "@/lib/actions/expenses";

interface ExpenseFormProps {
  tripId: string;
}

export function ExpenseForm({ tripId }: ExpenseFormProps) {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    formData.set("tripId", tripId);
    await createExpense(formData);
    setOpen(false);
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
        <form action={handleSubmit} className="space-y-4">
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
            <Button type="submit">追加する</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
