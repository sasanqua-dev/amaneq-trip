import { Link, useParams } from "react-router";
import { useCallback, useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ExpenseTable, type ExpenseItem } from "~/components/trips/expense-table";
import { ExpenseForm } from "~/components/trips/expense-form";
import { useSupabase } from "~/lib/supabase";
import { useAppUser } from "~/lib/auth";
import { getExpenses, getTripMembers } from "@amaneq/core";

export default function TripExpensesPage() {
  const { tripId } = useParams();
  const client = useSupabase();
  const { dbUserId } = useAppUser();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [memberCount, setMemberCount] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!tripId || !dbUserId) return;

    const [expensesResult, membersResult] = await Promise.all([
      getExpenses(client, tripId),
      getTripMembers(client, tripId),
    ]);

    const rawExpenses = (expensesResult.data ?? []) as Array<{
      id: string;
      title: string;
      amount: number;
      category: string | null;
    }>;
    setExpenses(
      rawExpenses.map((e) => ({
        id: e.id,
        title: e.title,
        amount: e.amount,
        category: e.category,
        paidByName: "自分",
      }))
    );

    const members = membersResult.data ?? [];
    setMemberCount(members.length || 1);
    setLoading(false);
  }, [tripId, dbUserId, client]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const perPerson = memberCount > 0 ? Math.ceil(total / memberCount) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/trips/${tripId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">費用管理</h1>
        </div>
        <ExpenseForm tripId={tripId!} onCreated={loadData} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              合計金額
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">&yen;{total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              メンバー数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{memberCount}人</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              1人あたり
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              &yen;{perPerson.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <ExpenseTable
        tripId={tripId!}
        expenses={expenses}
        onDeleted={loadData}
      />
    </div>
  );
}
