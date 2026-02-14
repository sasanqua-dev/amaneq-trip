import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useAppUser } from "../../../lib/hooks";
import type { Database, TripStatus } from "@amaneq/core";

type Trip = Database["public"]["Tables"]["trips"]["Row"];

const STATUS_OPTIONS: { value: TripStatus; label: string }[] = [
  { value: "draft", label: "下書き" },
  { value: "planned", label: "予定" },
  { value: "ongoing", label: "進行中" },
  { value: "completed", label: "完了" },
];

export default function EditTripScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { supabase } = useAppUser();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<TripStatus>("draft");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!supabase || !tripId) return;
    supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .single()
      .then(({ data }) => {
        if (data) {
          setTrip(data);
          setTitle(data.title);
          setDescription(data.description ?? "");
          setStartDate(data.start_date ?? "");
          setEndDate(data.end_date ?? "");
          setStatus(data.status);
        }
        setLoading(false);
      });
  }, [supabase, tripId]);

  const handleSave = async () => {
    if (!supabase || !tripId || !title.trim()) {
      Alert.alert("エラー", "タイトルを入力してください");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("trips")
      .update({
        title: title.trim(),
        description: description.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        status,
      })
      .eq("id", tripId);

    setSaving(false);
    if (error) {
      Alert.alert("エラー", "保存に失敗しました");
    } else {
      router.back();
    }
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
      <Stack.Screen options={{ title: "旅行を編集" }} />
      <ScrollView style={styles.container}>
        <View style={styles.form}>
          <Text style={styles.label}>タイトル *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="旅行のタイトル"
          />

          <Text style={styles.label}>説明</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="旅行の説明"
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>開始日 (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="2025-01-01"
          />

          <Text style={styles.label}>終了日 (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="2025-01-03"
          />

          <Text style={styles.label}>ステータス</Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  styles.statusOption,
                  status === opt.value && styles.statusOptionActive,
                ]}
                onPress={() => setStatus(opt.value)}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    status === opt.value && styles.statusOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "保存中..." : "保存"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  form: { padding: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#1f2937",
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  statusRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  statusOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
  },
  statusOptionActive: { backgroundColor: "#2563eb" },
  statusOptionText: { fontSize: 14, color: "#6b7280", fontWeight: "500" },
  statusOptionTextActive: { color: "#fff" },
  saveButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 28,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
