import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import Frame from "../Frame";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const Sidebar = ({ navigation }) => {
  // 로그인 상태 관리 (나중에 실제 로그인 로직으로 변경)
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 로그인 후 상단에 표시할 사용자 정보 컴포넌트
  const renderUserInfo = () => {
    if (!isLoggedIn) return null;

    return (
      <View style={styles.userInfoContainer}>
        <View style={styles.profileImagePlaceholder}>
          <Ionicons name="person" size={40} color="#40ABE5" />
        </View>
        <Text style={styles.userName}>User Name</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setIsLoggedIn(false)}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // 로그인 버튼 (비로그인 상태일 때만 표시)
  const renderLoginButton = () => {
    if (isLoggedIn) return null;

    return (
      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => navigation.navigate("Login")}
      >
        <LinearGradient
          colors={['#40ABE5', '#528099']}
          style={styles.loginGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.loginText}>Login / Sign Up</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <Frame AppName="" disableBackground={true} style={styles.container}>
      {/* 사용자 정보 (로그인 상태일 때만 표시) */}
      {renderUserInfo()}

      {/* 메뉴 아이템 */}
      <View style={styles.menuContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Main")}
          style={styles.chatMenuItem}
        >
          <Text style={styles.link}>Chat</Text>
          <MaterialCommunityIcons
            name="chat-plus-outline"
            size={40}
            color="black"
            style={styles.icon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("HistoryCulture")}
          style={styles.menuItem}
        >
          <Text style={styles.link}>History/Culture</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("PersonalContent")}
          style={styles.menuItem}
        >
          <Text style={styles.link}>PersonalContent</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("PrepareTravels")}
          style={styles.menuItem}
        >
          <Text style={styles.link}>Prepare Travels</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Emergency")}
          style={styles.menuItem}
        >
          <Text style={styles.link}>Emergency</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("MyPage")}
          style={styles.menuItem}
        >
          <Text style={styles.link}>My Page</Text>
        </TouchableOpacity>
      </View>

      {/* 로그인 버튼 (화면 아래쪽에 배치) */}
      <View style={styles.loginButtonContainer}>
        {renderLoginButton()}
      </View>
    </Frame>
  );
};

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    backgroundColor: "#fff",
  },
  userInfoContainer: {
    alignItems: "center",
    padding: 20,
    marginTop: 30,
    marginBottom: 20,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EEF7FB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  userName: {
    fontFamily: "OriginalSurfer",
    fontSize: 24,
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: "#EEF7FB",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 5,
  },
  logoutText: {
    color: "#40ABE5",
    fontFamily: "Outfit",
    fontSize: 16,
  },
  menuContainer: {
    flex: 1,
    marginTop: 20,
  },
  loginButtonContainer: {
    alignItems: 'flex-end',
    paddingRight: 20,
    paddingBottom: 30,
  },
  loginButton: {
    width: 180,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
  },
  loginGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  loginText: {
    color: "white",
    fontFamily: "OriginalSurfer",
    fontSize: 18,
  },
  chatMenuItem: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 30,
    marginBottom: 15,
  },
  menuItem: {
    paddingVertical: 10,
    marginBottom: 15,
  },
  link: {
    fontFamily: "OriginalSurfer",
    fontSize: 26,
    color: "black",
    paddingLeft: 30,
    textShadowColor: "#89D6FF",
    textShadowOffset: { width: 0, height: 4 },
    textShadowOpacity: 1,
    textShadowRadius: 4,
    elevation: 5,
  },
  icon: {
    paddingRight: 5,
  },
});

export default Sidebar;
