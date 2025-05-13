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
  // Login state management
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { resetChat } = useChat();

  // Check token on component mount
  useEffect(() => {
    checkLoginStatus();
  }, []);

  // Check login status function
  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      setIsLoggedIn(!!token); // Set logged in if token exists
    } catch (error) {
      console.error('Error checking token:', error);
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      // 로그인 토큰 삭제
      await AsyncStorage.removeItem('access_token');

      // 세션 ID 삭제
      await AsyncStorage.removeItem('current_session_id');

      // 모든 저장된 데이터 지우기
      await clearAllUserData();

      // 로그인 상태 업데이트
      setIsLoggedIn(false);

      // Reset chat on logout
      resetChat();

      // Stop TTS if running
      if (Speech && Speech.stop) {
        Speech.stop();
      }

      Alert.alert('Notice', 'You have been logged out.');

      // Navigate to main screen
      setTimeout(() => {
        navigation.navigate("Main");
      }, 50);
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'There was a problem during logout.');
    }
  };

  // 모든 사용자 관련 데이터 삭제 함수
  const clearAllUserData = async () => {
    try {
      // 필수 키 목록 (직접 삭제할 중요 키들)
      const keysToRemove = [
        // 로그인 및 세션 관련
        'access_token',
        'current_session_id',

        // 채팅 데이터 관련
        'active_message_id',
        'last_response_data',

        // 준비물 데이터 관련
        'travel_essentials_data',
        'travel_essentials_destination',
        'travel_essentials_startDate',
        'travel_essentials_endDate',
        'latest_preparation_data_key',
        'preparation_data_exists',
        'preparation_data_timestamp'
      ];

      // 필수 키 삭제
      for (const key of keysToRemove) {
        await AsyncStorage.removeItem(key);
      }

      // 모든 키 가져오기 (동적으로 생성된 키 삭제용)
      const allKeys = await AsyncStorage.getAllKeys();

      // 특정 패턴의 키들 찾기 (message_, response_, prep_data_ 등으로 시작하는 키)
      const dynamicKeys = allKeys.filter(key =>
        key.startsWith('message_') ||
        key.startsWith('response_') ||
        key.startsWith('prep_data_') ||
        key.startsWith('content_') ||
        key.startsWith('preparation_')
      );

      // 로그 확인
      console.log(`총 ${dynamicKeys.length}개의 동적 키를 삭제합니다.`);

      // 동적 키들 삭제
      if (dynamicKeys.length > 0) {
        await AsyncStorage.multiRemove(dynamicKeys);
      }

      console.log('모든 사용자 데이터가 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('데이터 삭제 중 오류:', error);
      // 오류가 발생해도 로그아웃 프로세스는 계속 진행
    }
  };

  // Function to dismiss keyboard when navigating
  const navigateAndDismissKeyboard = (screenName) => {
    Keyboard.dismiss(); // Dismiss keyboard

    // Navigate after keyboard is dismissed
    setTimeout(() => {
      navigation.navigate(screenName);
    }, 50); // 50ms delay
  };

  // Simple navigation function (no chat reset)
  const handleNavigateToMain = () => {
    Keyboard.dismiss(); // Dismiss keyboard

    // Navigate after keyboard is dismissed
    setTimeout(() => {
      navigation.navigate("Main");
    }, 50); // 50ms delay
  };

  // Navigation function with chat reset
  const handleResetChatAndNavigate = () => {
    Keyboard.dismiss(); // Dismiss keyboard

    // Reset chat - also creates new session
    resetChat();

    // Stop TTS if running
    if (Speech && Speech.stop) {
      Speech.stop();
    }

    // Navigate after keyboard is dismissed
    setTimeout(() => {
      navigation.navigate("Main");

      // New chat alert
      setTimeout(() => {
        Alert.alert(
          "New Chat",
          "Starting a new chat session.",
          [{ text: "OK" }],
          { cancelable: true }
        );
      }, 300);
    }, 50); // 50ms delay
  };

  // User info component to display after login
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

  // Login button (only shown when not logged in)
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
      {/* User info (only displayed when logged in) */}
      {renderUserInfo()}

      {/* Menu items */}
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

      {/* Login button (placed at bottom of screen) */}
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
