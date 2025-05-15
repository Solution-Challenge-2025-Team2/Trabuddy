import { View, Text, TouchableOpacity, StyleSheet, Keyboard } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function Header({ AppName }) {
  const navigation = useNavigation();
  const route = useRoute(); // 현재 route 정보 가져오기

  // 키보드를 내리고 네비게이션하는 함수
  const handleNavigation = () => {
    Keyboard.dismiss(); // 키보드 내리기

    // 키보드가 내려간 후 네비게이션 실행 (약간의 지연 추가)
    setTimeout(() => {
      if (route.name === "Sidebar") {
        // 현재 route가 Sidebar일 때는 뒤로가기
        navigation.goBack();
      } else {
        // 아닌 경우는 Sidebar로 이동
        navigation.navigate("Sidebar");
      }
    }, 50); // 50ms 지연
  };

  // 메인 화면으로 이동하는 함수
  const navigateToMain = () => {
    Keyboard.dismiss(); // 키보드 내리기

    // 키보드가 내려간 후 네비게이션 실행
    setTimeout(() => {
      navigation.navigate("Main");
    }, 50); // 50ms 지연
  };

  return (
    <View
      style={[styles.header, route.name === "Sidebar" && styles.sidebarBorder]}
    >
      <TouchableOpacity onPress={handleNavigation}>
        <Text style={styles.sidebarButton}>☰</Text> {/* 아이콘 바꾸어야 함 */}
      </TouchableOpacity>
      <TouchableOpacity onPress={navigateToMain} style={styles.titleContainer}>
        <Text style={styles.title}>{AppName}</Text>
      </TouchableOpacity>
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
  titleContainer: {
    flex: 0.9,
  },
  title: {
    fontSize: 32,
    fontFamily: "OriginalSurfer",
    textAlign: "center",
  },
});
