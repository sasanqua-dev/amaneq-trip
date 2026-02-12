"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteExpense } from "@/lib/actions/expenses";

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  category: string | null;
  paidByName: string;
}

interface ExpenseTableProps {
  tripId: string;
  expenses: ExpenseItem[];
}

const categoryLabels: Record<string, string> = {
  transport: "交通",
  accommodation: "宿泊",
  food: "食事",
  ticket: "チケット",
  shopping: "買い物",
  other: "その他",
};

export function ExpenseTable({ tripId, expenses }: ExpenseTableProps) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  if (expenses.length === 0) {
    return (
      <p className="text-muted-foreground">
        費用はまだありません。「費用を追加」ボタンから追加してください。
      </p>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>項目</TableHead>
            <TableHead>カテゴリ</TableHead>
            <TableHead>支払者</TableHead>
            <TableHead className="text-right">金額</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="font-medium">{expense.title}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {(expense.category && categoryLabels[expense.category]) ?? expense.category ?? "その他"}
                </Badge>
              </TableCell>
              <TableCell>{expense.paidByName}</TableCell>
              <TableCell className="text-right">
                &yen;{expense.amount.toLocaleString()}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteExpense(expense.id, tripId)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={3} className="font-semibold">
              合計
            </TableCell>
            <TableCell className="text-right font-semibold">
              &yen;{total.toLocaleString()}
            </TableCell>
            <TableCell />
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
