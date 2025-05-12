import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Keyboard,
} from "react-native";
import Frame from "../Frame";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useChat } from "../context/ChatContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from "expo-speech";

const Sidebar = ({ navigation }) => {
  // 로그인 상태 관리
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { resetChat } = useChat();

  // 컴포넌트 마운트 시 토큰 확인
  useEffect(() => {
    checkLoginStatus();
  }, []);

  // 로그인 상태 확인 함수
  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      setIsLoggedIn(!!token); // 토큰이 있으면 로그인 상태로 설정
    } catch (error) {
      console.error('토큰 확인 오류:', error);
    }
  };

  // 로그아웃 함수
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('access_token');
      setIsLoggedIn(false);
      Alert.alert('알림', '로그아웃되었습니다.');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
    }
  };

  // 페이지 이동 시 키보드 내리는 함수
  const navigateAndDismissKeyboard = (screenName) => {
    Keyboard.dismiss(); // 키보드 내리기

    // 키보드가 내려간 후 네비게이션 실행
    setTimeout(() => {
      navigation.navigate(screenName);
    }, 50); // 50ms 지연
  };

  // 단순 네비게이션 함수 (채팅 초기화 없음)
  const handleNavigateToMain = () => {
    Keyboard.dismiss(); // 키보드 내리기

    // 키보드가 내려간 후 네비게이션 실행
    setTimeout(() => {
      navigation.navigate("Main");
    }, 50); // 50ms 지연
  };

  // 채팅 초기화 후 네비게이션 함수
  const handleResetChatAndNavigate = () => {
    Keyboard.dismiss(); // 키보드 내리기

    // 채팅 초기화 - 새 세션도 생성됨
    resetChat();

    // TTS가 실행 중이면 중지
    if (Speech && Speech.stop) {
      Speech.stop();
    }

    // 키보드가 내려간 후 네비게이션 실행
    setTimeout(() => {
      navigation.navigate("Main");

      // 새 채팅 시작 알림
      setTimeout(() => {
        Alert.alert(
          "새 채팅",
          "새로운 채팅을 시작합니다.",
          [{ text: "확인" }],
          { cancelable: true }
        );
      }, 300);
    }, 50); // 50ms 지연
  };

  // 로그인 후 상단에 표시할 사용자 정보 컴포넌트
  const renderUserInfo = () => {
    if (!isLoggedIn) return null;

    return (
      <View style={styles.userInfoContainer}>
        <View style={styles.profileImagePlaceholder}>
          <Image
            source={require('../assets/figma_images/trabuddy_face.png')}
            style={styles.profileImage}
          />
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
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
        <View style={styles.chatMenuItem}>
          <TouchableOpacity
            onPress={handleNavigateToMain}
            style={styles.chatMenuTextWrapper}
          >
            <Text style={styles.link}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleResetChatAndNavigate}
            style={styles.chatIconWrapper}
          >
            <MaterialCommunityIcons
              name="chat-plus-outline"
              size={40}
              color="black"
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigateAndDismissKeyboard("HistoryCulture")}
          style={styles.menuItem}
        >
          <Text style={styles.link}>History/Culture</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateAndDismissKeyboard("PersonalContent")}
          style={styles.menuItem}
        >
          <Text style={styles.link}>PersonalContent</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateAndDismissKeyboard("PrepareTravels")}
          style={styles.menuItem}
        >
          <Text style={styles.link}>Prepare Travels</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateAndDismissKeyboard("Emergency")}
          style={styles.menuItem}
        >
          <Text style={styles.link}>Emergency</Text>
        </TouchableOpacity>

        {isLoggedIn && (
          <TouchableOpacity
            onPress={() => navigateAndDismissKeyboard("PreviousChat")}
            style={styles.menuItem}
          >
            <Text style={styles.link}>Previous Chat</Text>
          </TouchableOpacity>
        )}
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
    backgroundColor: "#40ABE5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    overflow: 'hidden',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  chatMenuTextWrapper: {
    paddingVertical: 10,
  },
  chatIconWrapper: {
    padding: 5,
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
