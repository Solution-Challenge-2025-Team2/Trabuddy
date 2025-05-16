import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useChat } from "../context/ChatContext";
import * as Speech from "expo-speech";

export default function LoginScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true); // true: 로그인, false: 회원가입
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [idCheckMessage, setIdCheckMessage] = useState("");
  const [isIdAvailable, setIsIdAvailable] = useState(false);
  const [isCheckingId, setIsCheckingId] = useState(false);
  const { resetChat, clearChatOnly, setIsLoggedIn, isLoggedIn } = useChat(); // isLoggedIn 추가

  const pwdRef = useRef(null); // 비밀번호 입력 필드 참조

  // 이미 로그인한 사용자가 로그인 페이지 접근 시 메인 페이지로 리디렉션
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");
        if (token) {
          console.log(
            "이미 로그인된 사용자가 로그인 페이지에 접근 시도, 메인으로 리디렉션"
          );
          navigation.replace("Main");
        }
      } catch (error) {
        console.error("로그인 상태 확인 오류:", error);
      }
    };

    checkAuthStatus();
  }, [navigation]);

  useEffect(() => {
    if (pwdRef.current) {
      pwdRef.current.setNativeProps({ style: { fontFamily: "Outfit" } });
    }
  }, []);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    // 입력 필드 초기화
    setUsername("");
    setPassword("");
    setConfirmPassword("");
  };

  // 모든 사용자 관련 데이터 삭제 함수
  const clearAllUserData = async () => {
    try {
      // 필수 키 목록 (직접 삭제할 중요 키들)
      const keysToRemove = [
        // 채팅 데이터 관련
        "active_message_id",
        "last_response_data",

        // 준비물 데이터 관련
        "travel_essentials_data",
        "travel_essentials_destination",
        "travel_essentials_startDate",
        "travel_essentials_endDate",
        "latest_preparation_data_key",
        "preparation_data_exists",
        "preparation_data_timestamp",

        // 역사/문화 데이터 관련
        "historical_culture_data",
        "historical_data_exists",
        "historical_data_timestamp",
        "latest_historical_data_key",
      ];

      // 필수 키 삭제
      for (const key of keysToRemove) {
        await AsyncStorage.removeItem(key);
      }

      // 모든 키 가져오기 (동적으로 생성된 키 삭제용)
      const allKeys = await AsyncStorage.getAllKeys();

      // 특정 패턴의 키들 찾기 (message_, response_, prep_data_ 등으로 시작하는 키)
      const dynamicKeys = allKeys.filter(
        (key) =>
          key.startsWith("message_") ||
          key.startsWith("response_") ||
          key.startsWith("prep_data_") ||
          key.startsWith("content_") ||
          key.startsWith("preparation_") ||
          key.startsWith("hist_data_") ||
          key.startsWith("historical_")
      );

      // 로그 확인
      console.log(`총 ${dynamicKeys.length}개의 동적 키를 삭제합니다.`);

      // 동적 키들 삭제
      if (dynamicKeys.length > 0) {
        await AsyncStorage.multiRemove(dynamicKeys);
      }

      console.log("로그인 전 모든 사용자 데이터가 성공적으로 삭제되었습니다.");
    } catch (error) {
      console.error("데이터 삭제 중 오류:", error);
      // 오류가 발생해도 로그인 프로세스는 계속 진행
    }
  };

  const handleCheckDuplicate = async () => {
    if (!username) {
      setIdCheckMessage("Please enter ID.");
      setIsIdAvailable(false);
      return;
    }
    setIsCheckingId(true);
    setIdCheckMessage("");
    try {
      const response = await fetch(
        "https://api.trabuddy.shop/auth/checkduplicate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        }
      );
      const data = await response.json();
      if (data.message === "Available Username") {
        setIdCheckMessage("Available ID");
        setIsIdAvailable(true);
      } else {
        setIdCheckMessage("ID already exists. Choose another one.");
        console.log(data.message);
        setIsIdAvailable(false);
      }
    } catch (error) {
      setIdCheckMessage("Server error. Please try again.");
      setIsIdAvailable(false);
    } finally {
      setIsCheckingId(false);
    }
  };

  const handleSignUp = async () => {
    if (!username || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (!isIdAvailable) {
      Alert.alert("Error", "Please check for ID duplication");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("https://api.trabuddy.shop/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data.message === "signup success") {
        Alert.alert("Success", "Registration complete. Please log in.", [
          { text: "OK", onPress: () => setIsLogin(true) },
        ]);
      } else {
        Alert.alert("Error", data.message || "Registration failed");
      }
    } catch (error) {
      Alert.alert("Error", "There was a problem with registration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter both ID and password");
      return;
    }
    setIsLoading(true);
    try {
      console.log("로그인 시도:", username);

      const response = await fetch("https://api.trabuddy.shop/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      // HTTP 상태 코드 로깅
      console.log("로그인 응답 상태 코드:", response.status);

      const data = await response.json();

      // 전체 응답 데이터 로깅
      console.log("로그인 응답 데이터:", JSON.stringify(data));

      if (data.access_token) {
        console.log(
          "토큰 수신 성공:",
          data.access_token.substring(0, 20) + "..."
        );
        console.log("세션ID 포함 여부:", data.sessionId ? "포함" : "미포함");

        // 로그인 전 모든 사용자 관련 데이터 삭제
        await clearAllUserData();

        // 로그인 상태 업데이트 - 이 부분을 먼저 실행
        setIsLoggedIn(true);
        console.log("로그인 상태 true로 업데이트");

        // 토큰 저장
        await AsyncStorage.setItem("access_token", data.access_token);

        // sessionId가 존재하면 저장
        if (data.sessionId) {
          await AsyncStorage.setItem(
            "current_session_id",
            data.sessionId.toString()
          );
          console.log("로그인 성공 - 기존 세션ID 저장됨:", data.sessionId);
        } else {
          // 기존 세션ID가 있으면 유지, 없으면 null 상태로 둠
          const existingSessionId = await AsyncStorage.getItem(
            "current_session_id"
          );
          console.log(
            "로그인 성공 - 세션ID 없음. 기존 세션ID:",
            existingSessionId || "null"
          );
        }

        // AsyncStorage 내용 확인용 디버깅 로그
        const storedToken = await AsyncStorage.getItem("access_token");
        const storedSessionId = await AsyncStorage.getItem(
          "current_session_id"
        );
        console.log("저장된 토큰 확인:", storedToken ? "있음" : "없음");
        console.log("저장된 세션ID 확인:", storedSessionId || "null");

        // 상태 업데이트 후 약간의 지연 추가
        await new Promise((resolve) => setTimeout(resolve, 100));

        // 로그인 성공 시 채팅만 초기화하고 세션은 생성하지 않음
        await clearChatOnly();

        // TTS가 실행 중이면 중지
        if (Speech && Speech.stop) {
          Speech.stop();
        }

        Alert.alert("Success", "Login successful", [
          {
            text: "OK",
            onPress: () => {
              Keyboard.dismiss();
              setTimeout(() => {
                navigation.navigate("Main");
              }, 50);
            },
          },
        ]);
      } else {
        console.log("로그인 실패: 토큰 없음");
        Alert.alert("Error", "ID or password does not match");
      }
    } catch (error) {
      console.error("로그인 요청 오류:", error);
      Alert.alert("Error", "There was a problem during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async () => {
    if (isLogin) {
      await handleLogin();
    } else {
      await handleSignUp();
    }
  };

  return (
    <LinearGradient
      colors={["#B2E4FF", "#FFFFFF"]}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.8 }}
    >
      <StatusBar backgroundColor="#B2E4FF" barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <Header AppName="Trabuddy" />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidView}
        >
          <View style={styles.contentContainer}>
            <Text style={styles.title}>
              {isLogin ? "Welcome Back!" : "Create Account"}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>ID</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your ID"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setIsIdAvailable(false);
                  setIdCheckMessage("");
                }}
                autoCapitalize="none"
              />
              {!isLogin && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.duplicateButton,
                      isCheckingId && { opacity: 0.7 },
                    ]}
                    onPress={handleCheckDuplicate}
                    disabled={isCheckingId}
                  >
                    <Text style={styles.duplicateButtonText}>
                      {isCheckingId ? "Checking..." : "Check Duplicate"}
                    </Text>
                  </TouchableOpacity>
                  {idCheckMessage !== "" && (
                    <Text
                      style={{
                        marginTop: 4,
                        color: isIdAvailable ? "#408A00" : "#B60000",
                        fontSize: 13,
                        fontWeight: "bold",
                        alignSelf: "flex-end",
                      }}
                    >
                      {idCheckMessage}
                    </Text>
                  )}
                </>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  ref={pwdRef}
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={24}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    ref={pwdRef}
                    style={styles.passwordInput}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={24}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {isLogin && (
              <TouchableOpacity style={styles.forgotPasswordContainer}>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, isLoading && styles.disabledButton]}
              onPress={handleAction}
              disabled={isLoading}
            >
              <LinearGradient
                colors={["#40ABE5", "#528099"]}
                style={styles.actionButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.actionButtonText}>
                  {isLogin ? (isLoading ? "Log in..." : "Login") : "Sign Up"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.switchModeContainer}>
              <Text style={styles.switchModeText}>
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}
              </Text>
              <TouchableOpacity onPress={toggleMode}>
                <Text style={styles.switchModeButton}>
                  {isLogin ? "Sign Up" : "Login"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontFamily: "OriginalSurfer",
    fontSize: 28,
    marginBottom: 30,
    color: "#333",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: "Outfit",
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontFamily: "Outfit",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  passwordContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontFamily: "Outfit",
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 25,
  },
  forgotPassword: {
    fontFamily: "Outfit",
    fontSize: 14,
    color: "#40ABE5",
  },
  actionButton: {
    width: "100%",
    height: 55,
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  actionButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    fontFamily: "OriginalSurfer",
    fontSize: 20,
    color: "#FFFFFF",
  },
  switchModeContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  switchModeText: {
    fontFamily: "Outfit",
    fontSize: 16,
    color: "#666",
  },
  switchModeButton: {
    fontFamily: "Outfit",
    fontSize: 16,
    color: "#40ABE5",
    marginLeft: 5,
  },
  duplicateButton: {
    width: "100%",
    backgroundColor: "#E9FEFF",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  duplicateButtonText: {
    color: "black",
    fontSize: 16,
    fontFamily: "Outfit",
  },
});
