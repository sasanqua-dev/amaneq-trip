import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useAppUser } from "../../../lib/hooks";
import type { Database, TripStatus, MemberRole } from "@amaneq/core";

type Trip = Database["public"]["Tables"]["trips"]["Row"];
type TripMember = Database["public"]["Tables"]["trip_members"]["Row"];

const STATUS_LABELS: Record<TripStatus, string> = {
  draft: "下書き",
  planned: "予定",
  ongoing: "進行中",
  completed: "完了",
};

export default function TripDetailScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { supabase, dbUser } = useAppUser();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [itineraryCount, setItineraryCount] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !tripId) return;
    setLoading(true);
    Promise.all([
      supabase.from("trips").select("*").eq("id", tripId).single(),
      supabase.from("trip_members").select("*").eq("trip_id", tripId),
      supabase
        .from("itinerary_items")
        .select("id", { count: "exact" })
        .eq("trip_id", tripId),
      supabase.from("expenses").select("amount").eq("trip_id", tripId),
    ]).then(([tripRes, membersRes, itineraryRes, expensesRes]) => {
      setTrip(tripRes.data);
      setMembers(membersRes.data ?? []);
      setItineraryCount(itineraryRes.count ?? 0);
      const total = (expensesRes.data ?? []).reduce(
        (sum, e) => sum + e.amount,
        0
      );
      setExpenseTotal(total);
      setLoading(false);
    });
  }, [supabase, tripId]);

  const handleDelete = () => {
    Alert.alert("旅行を削除", "この旅行を削除しますか？元に戻せません。", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          if (!supabase || !tripId) return;
          await supabase.from("trips").delete().eq("id", tripId);
          router.back();
        },
      },
    ]);
  };

  const isOwner = members.some(
    (m) => m.user_id === dbUser?.id && m.role === "owner"
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.center}>
        <Text>旅行が見つかりません</Text>
      </View>
    );
  }

  const perPerson =
    members.length > 0 ? Math.ceil(expenseTotal / members.length) : 0;

  return (
    <>
      <Stack.Screen options={{ title: trip.title }} />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{trip.title}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {STATUS_LABELS[trip.status]}
              </Text>
            </View>
          </View>
          {trip.description && (
            <Text style={styles.description}>{trip.description}</Text>
          )}
          {trip.start_date && (
            <Text style={styles.dateText}>
              {trip.start_date}
              {trip.end_date ? ` ~ ${trip.end_date}` : ""}
            </Text>
          )}
          <Text style={styles.memberCount}>
            メンバー {members.length}人
          </Text>
        </View>

        <View style={styles.statsRow}>
          <Pressable
            style={styles.statCard}
            onPress={() => router.push(`/trip/${tripId}/itinerary` as const)}
          >
            <Text style={styles.statNumber}>{itineraryCount}</Text>
            <Text style={styles.statLabel}>スポット</Text>
          </Pressable>
          <Pressable
            style={styles.statCard}
            onPress={() => router.push(`/trip/${tripId}/expenses` as const)}
          >
            <Text style={styles.statNumber}>
              ¥{expenseTotal.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>
              合計 (¥{perPerson.toLocaleString()}/人)
            </Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push(`/trip/${tripId}/itinerary` as const)}
          >
            <Text style={styles.primaryButtonText}>日程を見る</Text>
          </Pressable>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push(`/trip/${tripId}/expenses` as const)}
          >
            <Text style={styles.primaryButtonText}>費用を見る</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push(`/trip/${tripId}/edit` as const)}
          >
            <Text style={styles.secondaryButtonText}>編集</Text>
          </Pressable>
          {isOwner && (
            <Pressable style={styles.dangerButton} onPress={handleDelete}>
              <Text style={styles.dangerButtonText}>削除</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#1f2937", flex: 1 },
  statusBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 12, color: "#2563eb", fontWeight: "600" },
  description: { fontSize: 14, color: "#6b7280", marginTop: 8 },
  dateText: { fontSize: 14, color: "#9ca3af", marginTop: 8 },
  memberCount: { fontSize: 13, color: "#9ca3af", marginTop: 4 },
  statsRow: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  statLabel: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  actions: { padding: 16, gap: 10 },
  primaryButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: { color: "#374151", fontSize: 16, fontWeight: "600" },
  dangerButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  dangerButtonText: { color: "#ef4444", fontSize: 16, fontWeight: "600" },
});
