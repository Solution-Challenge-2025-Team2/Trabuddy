import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function Header({ AppName }) {
  const navigation = useNavigation();
  const route = useRoute(); // 현재 route 정보 가져오기

  return (
    <View
      style={[styles.header, route.name === "Sidebar" && styles.sidebarBorder]}
    >
      <TouchableOpacity
        onPress={() => {
          if (route.name === "Sidebar") {
            // 현재 route가 Sidebar일 때는 뒤로가기
            navigation.goBack();
          } else {
            // 아닌 경우는 Sidebar로 이동
            navigation.navigate("Sidebar");
          }
        }}
        // 사이드바 버튼 누르면 페이지 이동
      >
        <Text style={styles.sidebarButton}>☰</Text> {/* 아이콘 바꾸어야 함 */}
      </TouchableOpacity>
      <Text style={styles.title}>{AppName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  sidebarButton: {
    fontSize: 24,
    marginRight: 16,
  },
  sidebarBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#D1D1D1",
  },
  title: {
    fontSize: 32,
    fontFamily: "OriginalSurfer",
    textAlign: "center",
    flex: 0.9,
  },
});
