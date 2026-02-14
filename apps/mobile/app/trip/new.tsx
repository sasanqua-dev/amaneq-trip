import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { useAppUser } from "../../lib/hooks";
import type { TripStatus } from "@amaneq/core";

const STATUS_OPTIONS: { value: TripStatus; label: string }[] = [
  { value: "draft", label: "下書き" },
  { value: "planned", label: "予定" },
  { value: "ongoing", label: "進行中" },
];

export default function NewTripScreen() {
  const { supabase, dbUser } = useAppUser();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<TripStatus>("draft");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!supabase || !dbUser || !title.trim()) {
      Alert.alert("エラー", "タイトルを入力してください");
      return;
    }
    setSaving(true);

    const { data: trip, error } = await supabase
      .from("trips")
      .insert({
        owner_id: dbUser.id,
        title: title.trim(),
        description: description.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        status,
      })
      .select()
      .single();

    if (error || !trip) {
      setSaving(false);
      Alert.alert("エラー", "旅行の作成に失敗しました");
      return;
    }

    // Add creator as owner member
    await supabase.from("trip_members").insert({
      trip_id: trip.id,
      user_id: dbUser.id,
      role: "owner",
    });

    setSaving(false);
    router.replace(`/trip/${trip.id}` as const);
  };

  return (
    <>
      <Stack.Screen options={{ title: "新しい旅行" }} />
      <ScrollView style={styles.container}>
        <View style={styles.form}>
          <Text style={styles.label}>タイトル *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="旅行のタイトル"
            autoFocus
          />

          <Text style={styles.label}>説明</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="旅行の説明（任意）"
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
            style={[styles.createButton, saving && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={saving}
          >
            <Text style={styles.createButtonText}>
              {saving ? "作成中..." : "旅行を作成"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
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
  createButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 28,
  },
  createButtonDisabled: { opacity: 0.6 },
  createButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
