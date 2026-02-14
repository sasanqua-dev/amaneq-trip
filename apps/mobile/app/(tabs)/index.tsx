import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAppUser } from "../../lib/hooks";
import type { Database } from "@amaneq/core";

type Trip = Database["public"]["Tables"]["trips"]["Row"];

export default function HomeScreen() {
  const { isAuthenticated, isLoading, supabase, dbUser, login } = useAppUser();
  const router = useRouter();
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !dbUser) return;
    setLoading(true);
    supabase
      .from("trips")
      .select("*")
      .in("status", ["planned", "ongoing"])
      .order("start_date", { ascending: true })
      .limit(3)
      .then(({ data }) => {
        setUpcomingTrips(data ?? []);
        setLoading(false);
      });
  }, [supabase, dbUser]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>amaneq trip</Text>
        <Text style={styles.subtitle}>旅行をもっと楽しく</Text>
        <Pressable style={styles.loginButton} onPress={login}>
          <Text style={styles.loginButtonText}>ログイン</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          おかえりなさい{dbUser?.display_name ? `、${dbUser.display_name}` : ""}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>直近の旅行</Text>
        {loading ? (
          <ActivityIndicator />
        ) : upcomingTrips.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>予定されている旅行はありません</Text>
            <Pressable
              style={styles.actionButton}
              onPress={() => router.push("/trip/new")}
            >
              <Text style={styles.actionButtonText}>旅行を作成</Text>
            </Pressable>
          </View>
        ) : (
          upcomingTrips.map((trip) => (
            <Pressable
              key={trip.id}
              style={styles.tripCard}
              onPress={() => router.push(`/trip/${trip.id}` as const)}
            >
              <Text style={styles.tripTitle}>{trip.title}</Text>
              {trip.start_date && (
                <Text style={styles.tripDate}>
                  {trip.start_date}
                  {trip.end_date ? ` ~ ${trip.end_date}` : ""}
                </Text>
              )}
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {trip.status === "planned" ? "予定" : "進行中"}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Pressable
          style={styles.actionButton}
          onPress={() => router.push("/(tabs)/trips")}
        >
          <Text style={styles.actionButtonText}>すべての旅行を見る</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f9fafb",
  },
  title: { fontSize: 32, fontWeight: "bold", color: "#1f2937" },
  subtitle: { fontSize: 16, color: "#6b7280", marginTop: 8, marginBottom: 32 },
  loginButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  loginButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  header: { padding: 20, paddingTop: 16 },
  greeting: { fontSize: 22, fontWeight: "bold", color: "#1f2937" },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyText: { color: "#9ca3af", marginBottom: 16 },
  tripCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tripTitle: { fontSize: 16, fontWeight: "600", color: "#1f2937" },
  tripDate: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  statusText: { fontSize: 12, color: "#2563eb", fontWeight: "500" },
  actionButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  actionButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
