import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function Header({}) {
  const navigation = useNavigation();

  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.navigate("Sidebar")}
        style={styles.sidebarButton} // 사이드바 버튼 누르면 페이지 이동
      >
        <Text style={styles.menu}>☰</Text> {/* 아이콘 바꾸어야 함 */}
      </TouchableOpacity>
      <Text style={styles.title}>Trabuddy</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    backgroundColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  sidebarButton: {
    fontSize: 24,
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
