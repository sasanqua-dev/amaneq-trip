import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from "react-native";
import { useAppUser } from "../../lib/hooks";

export default function SettingsScreen() {
  const { auth0User, dbUser, isAuthenticated, login, logout } = useAppUser();

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.label}>ログインしてください</Text>
        <Pressable style={styles.loginButton} onPress={login}>
          <Text style={styles.loginButtonText}>ログイン</Text>
        </Pressable>
      </View>
    );
  }

  const handleLogout = () => {
    Alert.alert("ログアウト", "ログアウトしますか？", [
      { text: "キャンセル", style: "cancel" },
      { text: "ログアウト", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>プロフィール</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>表示名</Text>
            <Text style={styles.value}>
              {dbUser?.display_name || "未設定"}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>メールアドレス</Text>
            <Text style={styles.value}>{auth0User?.email || "-"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>アカウント</Text>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>ログアウト</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 12,
  },
  label: { fontSize: 15, color: "#6b7280" },
  value: { fontSize: 15, color: "#1f2937", fontWeight: "500" },
  loginButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 32,
  },
  loginButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  logoutButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutButtonText: { color: "#ef4444", fontSize: 16, fontWeight: "600" },
});
