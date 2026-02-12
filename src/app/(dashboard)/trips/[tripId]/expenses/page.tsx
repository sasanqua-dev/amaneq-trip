import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ExpenseTable } from "@/components/trips/expense-table";
import { ExpenseForm } from "@/components/trips/expense-form";
import { ensureUser } from "@/lib/auth0";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

interface ExpensesPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function ExpensesPage({ params }: ExpensesPageProps) {
  const { tripId } = await params;
  const user = await ensureUser();
  if (!user) return null;

  const supabase = createServerClient();

  const [{ data: rawExpenses }, { count: memberCount }] = await Promise.all([
    supabase
      .from("expenses")
      .select()
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false }),
    supabase
      .from("trip_members")
      .select("id", { count: "exact", head: true })
      .eq("trip_id", tripId),
  ]);

  type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
  const typedExpenses = (rawExpenses ?? []) as ExpenseRow[];

  // Look up payer names
  const payerIds = [...new Set(typedExpenses.map((e) => e.paid_by).filter(Boolean))] as string[];
  const { data: payers } = payerIds.length > 0
    ? await supabase.from("users").select("id, display_name").in("id", payerIds)
    : { data: [] as { id: string; display_name: string | null }[] };

  const payerMap = new Map((payers ?? []).map((p) => [p.id, p.display_name ?? "自分"]));

  const expenses = typedExpenses.map((e) => ({
    id: e.id,
    title: e.title,
    amount: e.amount,
    category: e.category,
    paidByName: e.paid_by ? (payerMap.get(e.paid_by) ?? "自分") : "自分",
  }));

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const members = memberCount ?? 1;
  const perPerson = members > 0 ? Math.ceil(total / members) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/trips/${tripId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">費用管理</h1>
        </div>
        <ExpenseForm tripId={tripId} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              合計金額
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              &yen;{total.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              メンバー数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{members}人</p>
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

      <ExpenseTable tripId={tripId} expenses={expenses} />
    </div>
  );
}
