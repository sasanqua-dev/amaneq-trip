import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAppUser } from "../../lib/hooks";
import type { Database, TripStatus } from "@amaneq/core";

type Trip = Database["public"]["Tables"]["trips"]["Row"];

const STATUS_LABELS: Record<TripStatus, string> = {
  draft: "下書き",
  planned: "予定",
  ongoing: "進行中",
  completed: "完了",
};

const STATUS_COLORS: Record<TripStatus, { bg: string; text: string }> = {
  draft: { bg: "#f3f4f6", text: "#6b7280" },
  planned: { bg: "#dbeafe", text: "#2563eb" },
  ongoing: { bg: "#dcfce7", text: "#16a34a" },
  completed: { bg: "#e5e7eb", text: "#4b5563" },
};

type TabKey = "upcoming" | "past" | "draft";

export default function TripsScreen() {
  const { supabase, dbUser } = useAppUser();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");

  const fetchTrips = useCallback(async () => {
    if (!supabase || !dbUser) return;
    setLoading(true);
    const { data } = await supabase
      .from("trips")
      .select("*")
      .order("created_at", { ascending: false });
    setTrips(data ?? []);
    setLoading(false);
  }, [supabase, dbUser]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const filteredTrips = trips.filter((trip) => {
    if (activeTab === "upcoming")
      return trip.status === "planned" || trip.status === "ongoing";
    if (activeTab === "past") return trip.status === "completed";
    return trip.status === "draft";
  });

  const tabs: { key: TabKey; label: string }[] = [
    { key: "upcoming", label: "予定" },
    { key: "past", label: "過去" },
    { key: "draft", label: "下書き" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredTrips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>旅行がありません</Text>
            </View>
          }
          renderItem={({ item }) => {
            const colors = STATUS_COLORS[item.status];
            return (
              <Pressable
                style={styles.card}
                onPress={() => router.push(`/trip/${item.id}` as const)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.badgeText, { color: colors.text }]}>
                      {STATUS_LABELS[item.status]}
                    </Text>
                  </View>
                </View>
                {item.description && (
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                {item.start_date && (
                  <Text style={styles.cardDate}>
                    {item.start_date}
                    {item.end_date ? ` ~ ${item.end_date}` : ""}
                  </Text>
                )}
              </Pressable>
            );
          }}
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => router.push("/trip/new")}
      >
        <Text style={styles.fabText}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
  },
  tabActive: { backgroundColor: "#2563eb" },
  tabText: { fontSize: 14, color: "#6b7280", fontWeight: "500" },
  tabTextActive: { color: "#fff" },
  list: { padding: 16, paddingBottom: 80 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
    marginRight: 8,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: "500" },
  cardDesc: { fontSize: 14, color: "#6b7280", marginTop: 6 },
  cardDate: { fontSize: 13, color: "#9ca3af", marginTop: 6 },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: { color: "#9ca3af", fontSize: 15 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { fontSize: 28, color: "#fff", marginTop: -2 },
});
