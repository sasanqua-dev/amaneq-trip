"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { deleteTrip } from "@/lib/actions/trips";

interface DeleteTripButtonProps {
  tripId: string;
}

export function DeleteTripButton({ tripId }: DeleteTripButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          削除
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>旅行を削除しますか？</DialogTitle>
          <DialogDescription>
            この操作は取り消せません。行程や費用などのデータもすべて削除されます。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteTrip(tripId)}
          >
            削除する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
