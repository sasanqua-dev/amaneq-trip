import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useAppUser } from "../../../lib/hooks";
import type { Database, ItineraryCategory, TransportType } from "@amaneq/core";

type ItineraryItem =
  Database["public"]["Tables"]["itinerary_items"]["Row"];

const CATEGORY_LABELS: Record<ItineraryCategory, string> = {
  transport: "交通",
  sightseeing: "観光",
  meal: "食事",
  accommodation: "宿泊",
  other: "その他",
};

const CATEGORY_COLORS: Record<ItineraryCategory, string> = {
  transport: "#3b82f6",
  sightseeing: "#10b981",
  meal: "#f97316",
  accommodation: "#8b5cf6",
  other: "#6b7280",
};

const TRANSPORT_LABELS: Record<TransportType, string> = {
  shinkansen: "新幹線",
  express: "特急",
  local_train: "電車",
  bus: "バス",
  ship: "船",
  airplane: "飛行機",
  car: "車",
  taxi: "タクシー",
  walk: "徒歩",
  bicycle: "自転車",
  other: "その他",
};

function buildLinkedList(items: ItineraryItem[]): ItineraryItem[] {
  const byPrev = new Map<string | null, ItineraryItem>();
  for (const item of items) {
    byPrev.set(item.prev_item_id, item);
  }
  const sorted: ItineraryItem[] = [];
  let current = byPrev.get(null);
  while (current) {
    sorted.push(current);
    current = byPrev.get(current.id);
  }
  // Append any orphans
  if (sorted.length < items.length) {
    const ids = new Set(sorted.map((s) => s.id));
    for (const item of items) {
      if (!ids.has(item.id)) sorted.push(item);
    }
  }
  return sorted;
}

export default function ItineraryScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { supabase } = useAppUser();
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [tripTitle, setTripTitle] = useState("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!supabase || !tripId) return;
    setLoading(true);
    const [tripRes, itemsRes] = await Promise.all([
      supabase.from("trips").select("title, start_date").eq("id", tripId).single(),
      supabase.from("itinerary_items").select("*").eq("trip_id", tripId),
    ]);
    setTripTitle(tripRes.data?.title ?? "");
    setStartDate(tripRes.data?.start_date ?? null);
    setItems(itemsRes.data ?? []);
    setLoading(false);
  }, [supabase, tripId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const dayGroups = new Map<number, ItineraryItem[]>();
  items.forEach((item) => {
    const dayItems = dayGroups.get(item.day_number) ?? [];
    dayItems.push(item);
    dayGroups.set(item.day_number, dayItems);
  });

  const sections = Array.from(dayGroups.entries())
    .sort(([a], [b]) => a - b)
    .map(([day, dayItems]) => ({
      day,
      data: buildLinkedList(dayItems),
    }));

  const formatDayLabel = (day: number) => {
    if (startDate) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + day - 1);
      return `Day ${day} — ${d.getMonth() + 1}/${d.getDate()}`;
    }
    return `Day ${day}`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: `${tripTitle} — 日程` }} />
      <SectionList
        style={styles.container}
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>日程がまだ登録されていません</Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.dayHeader}>
            <Text style={styles.dayHeaderText}>
              {formatDayLabel(section.day)}
            </Text>
          </View>
        )}
        renderItem={({ item, index, section }) => {
          const category = item.category ?? "other";
          const color = CATEGORY_COLORS[category];
          const isLast = index === section.data.length - 1;

          return (
            <View style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                {item.start_time && (
                  <Text style={styles.timeText}>
                    {item.start_time.slice(0, 5)}
                  </Text>
                )}
                {!item.start_time && item.duration_minutes && (
                  <Text style={styles.durationText}>
                    約{item.duration_minutes}分
                  </Text>
                )}
              </View>

              <View style={styles.timelineDot}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                {!isLast && <View style={styles.line} />}
              </View>

              <View style={styles.timelineContent}>
                <View style={styles.itemCard}>
                  <View style={styles.categoryRow}>
                    <View
                      style={[styles.categoryBadge, { backgroundColor: color + "20" }]}
                    >
                      <Text style={[styles.categoryText, { color }]}>
                        {category === "transport" && item.transport_type
                          ? TRANSPORT_LABELS[item.transport_type]
                          : CATEGORY_LABELS[category]}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.itemTitle}>{item.title}</Text>

                  {item.description && (
                    <Text style={styles.itemDesc}>{item.description}</Text>
                  )}

                  {category === "transport" ? (
                    <View style={styles.transportInfo}>
                      {item.departure_name && (
                        <Text style={styles.locationText}>
                          {item.departure_name} → {item.arrival_name}
                        </Text>
                      )}
                      {(item.car_number || item.seat_number) && (
                        <Text style={styles.seatText}>
                          {[item.car_number, item.seat_number]
                            .filter(Boolean)
                            .join(" ")}
                        </Text>
                      )}
                    </View>
                  ) : (
                    item.location_name && (
                      <Pressable
                        onPress={() => {
                          if (item.latitude && item.longitude) {
                            Linking.openURL(
                              `https://maps.google.com/?q=${item.latitude},${item.longitude}`
                            );
                          }
                        }}
                      >
                        <Text style={styles.locationLink}>
                          📍 {item.location_name}
                        </Text>
                      </Pressable>
                    )
                  )}

                  {item.end_time && (
                    <Text style={styles.endTimeText}>
                      〜 {item.end_time.slice(0, 5)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { alignItems: "center", paddingVertical: 60 },
  emptyText: { color: "#9ca3af", fontSize: 15 },
  dayHeader: {
    backgroundColor: "#f9fafb",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  dayHeaderText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
  },
  timelineRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    minHeight: 80,
  },
  timelineLeft: {
    width: 50,
    paddingTop: 14,
    alignItems: "flex-end",
    paddingRight: 8,
  },
  timeText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  durationText: { fontSize: 10, color: "#9ca3af" },
  timelineDot: {
    width: 24,
    alignItems: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 16,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: "#e5e7eb",
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingVertical: 8,
    paddingLeft: 8,
  },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryRow: { flexDirection: "row", marginBottom: 6 },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: { fontSize: 11, fontWeight: "600" },
  itemTitle: { fontSize: 15, fontWeight: "600", color: "#1f2937" },
  itemDesc: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  transportInfo: { marginTop: 6 },
  locationText: { fontSize: 13, color: "#6b7280" },
  seatText: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  locationLink: { fontSize: 13, color: "#2563eb", marginTop: 6 },
  endTimeText: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 6,
    textAlign: "right",
  },
});
