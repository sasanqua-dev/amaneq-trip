import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useAppUser } from "../../../lib/hooks";
import type { Database, ExpenseCategory } from "@amaneq/core";

type Expense = Database["public"]["Tables"]["expenses"]["Row"];

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  transport: "交通",
  accommodation: "宿泊",
  food: "食事",
  ticket: "チケット",
  shopping: "お買い物",
  other: "その他",
};

const CATEGORY_COLORS: Record<ExpenseCategory, { bg: string; text: string }> = {
  transport: { bg: "#dbeafe", text: "#2563eb" },
  accommodation: { bg: "#ede9fe", text: "#7c3aed" },
  food: { bg: "#ffedd5", text: "#ea580c" },
  ticket: { bg: "#dcfce7", text: "#16a34a" },
  shopping: { bg: "#fce7f3", text: "#db2777" },
  other: { bg: "#f3f4f6", text: "#6b7280" },
};

export default function ExpensesScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { supabase } = useAppUser();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [memberCount, setMemberCount] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!supabase || !tripId) return;
    setLoading(true);
    const [expenseRes, memberRes] = await Promise.all([
      supabase
        .from("expenses")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false }),
      supabase
        .from("trip_members")
        .select("id", { count: "exact" })
        .eq("trip_id", tripId),
    ]);
    setExpenses(expenseRes.data ?? []);
    setMemberCount(memberRes.count ?? 1);
    setLoading(false);
  }, [supabase, tripId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = (expenseId: string) => {
    Alert.alert("費用を削除", "この費用を削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          if (!supabase) return;
          await supabase.from("expenses").delete().eq("id", expenseId);
          fetchData();
        },
      },
    ]);
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const perPerson = Math.ceil(total / memberCount);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "費用" }} />
      <View style={styles.container}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>合計</Text>
            <Text style={styles.summaryValue}>
              ¥{total.toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>1人あたり</Text>
            <Text style={styles.summaryValue}>
              ¥{perPerson.toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>メンバー</Text>
            <Text style={styles.summaryValue}>{memberCount}人</Text>
          </View>
        </View>

        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>費用が登録されていません</Text>
            </View>
          }
          renderItem={({ item }) => {
            const cat = item.category ?? "other";
            const colors = CATEGORY_COLORS[cat];
            return (
              <View style={styles.expenseCard}>
                <View style={styles.expenseMain}>
                  <View style={styles.expenseHeader}>
                    <Text style={styles.expenseTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Pressable onPress={() => handleDelete(item.id)}>
                      <Text style={styles.deleteBtn}>削除</Text>
                    </Pressable>
                  </View>
                  <View style={styles.expenseRow}>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: colors.bg },
                      ]}
                    >
                      <Text
                        style={[styles.categoryText, { color: colors.text }]}
                      >
                        {CATEGORY_LABELS[cat]}
                      </Text>
                    </View>
                    <Text style={styles.expenseAmount}>
                      ¥{item.amount.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  summaryRow: {
    flexDirection: "row",
    padding: 16,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryLabel: { fontSize: 12, color: "#6b7280" },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 4,
  },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  emptyContainer: { alignItems: "center", paddingVertical: 40 },
  emptyText: { color: "#9ca3af", fontSize: 15 },
  expenseCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  expenseMain: { gap: 8 },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
  },
  deleteBtn: { fontSize: 13, color: "#ef4444" },
  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: { fontSize: 11, fontWeight: "600" },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
});
