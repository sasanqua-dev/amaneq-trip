import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useAppUser } from "../../lib/hooks";

const PREFECTURES = [
  "北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島",
  "茨城", "栃木", "群馬", "埼玉", "千葉", "東京", "神奈川",
  "新潟", "富山", "石川", "福井", "山梨", "長野", "岐阜",
  "静岡", "愛知", "三重", "滋賀", "京都", "大阪", "兵庫",
  "奈良", "和歌山", "鳥取", "島根", "岡山", "広島", "山口",
  "徳島", "香川", "愛媛", "高知", "福岡", "佐賀", "長崎",
  "熊本", "大分", "宮崎", "鹿児島", "沖縄",
];

export default function MapScreen() {
  const { supabase, dbUser } = useAppUser();
  const [visitCounts, setVisitCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !dbUser) return;
    setLoading(true);
    supabase
      .from("prefecture_visits")
      .select("prefecture_code")
      .eq("user_id", dbUser.id)
      .then(({ data }) => {
        const counts: Record<number, number> = {};
        data?.forEach((v) => {
          counts[v.prefecture_code] = (counts[v.prefecture_code] || 0) + 1;
        });
        setVisitCounts(counts);
        setLoading(false);
      });
  }, [supabase, dbUser]);

  const visitedCount = Object.keys(visitCounts).length;
  const percentage = Math.round((visitedCount / 47) * 100);

  const getColor = (code: number) => {
    const count = visitCounts[code] || 0;
    if (count === 0) return "#e5e7eb";
    if (count === 1) return "#93c5fd";
    if (count <= 3) return "#3b82f6";
    return "#1d4ed8";
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>訪問都道府県</Text>
        <Text style={styles.statsNumber}>
          {visitedCount} <Text style={styles.statsTotal}>/ 47</Text>
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${percentage}%` }]}
          />
        </View>
        <Text style={styles.statsPercent}>{percentage}% 制覇</Text>
      </View>

      <View style={styles.gridContainer}>
        {PREFECTURES.map((name, i) => {
          const code = i + 1;
          return (
            <Pressable
              key={code}
              style={[styles.prefCell, { backgroundColor: getColor(code) }]}
            >
              <Text
                style={[
                  styles.prefText,
                  visitCounts[code]
                    ? styles.prefTextVisited
                    : styles.prefTextDefault,
                ]}
                numberOfLines={1}
              >
                {name}
              </Text>
              {visitCounts[code] ? (
                <Text style={styles.prefCount}>{visitCounts[code]}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  statsCard: {
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsTitle: { fontSize: 14, color: "#6b7280", fontWeight: "500" },
  statsNumber: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 4,
  },
  statsTotal: { fontSize: 20, color: "#9ca3af", fontWeight: "normal" },
  progressBar: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2563eb",
    borderRadius: 4,
  },
  statsPercent: { fontSize: 14, color: "#2563eb", marginTop: 8, fontWeight: "500" },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 6,
  },
  prefCell: {
    width: "22%",
    aspectRatio: 1.6,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  prefText: { fontSize: 11, fontWeight: "500" },
  prefTextDefault: { color: "#9ca3af" },
  prefTextVisited: { color: "#fff" },
  prefCount: { fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 1 },
});
