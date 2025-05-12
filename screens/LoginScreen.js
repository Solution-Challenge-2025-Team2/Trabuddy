import React, { useState } from "react";
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
    const { resetChat, clearChatOnly, setIsLoggedIn } = useChat(); // setIsLoggedIn 추가

    const toggleMode = () => {
        setIsLogin(!isLogin);
        // 입력 필드 초기화
        setUsername("");
        setPassword("");
        setConfirmPassword("");
    };

    const handleCheckDuplicate = async () => {
        if (!username) {
            setIdCheckMessage("ID를 입력하세요.");
            setIsIdAvailable(false);
            return;
        }
        setIsCheckingId(true);
        setIdCheckMessage("");
        try {
            const response = await fetch(
                "http://3.106.58.224:3000/auth/checkduplicate",
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
                setIdCheckMessage("Duplicated ID. Choose another one.");
                setIsIdAvailable(false);
            }
        } catch (error) {
            setIdCheckMessage("서버 오류. 다시 시도하세요.");
            setIsIdAvailable(false);
        } finally {
            setIsCheckingId(false);
        }
    };

    const handleSignUp = async () => {
        if (!username || !password || !confirmPassword) {
            Alert.alert("오류", "모든 필드를 입력해주세요");
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert("오류", "비밀번호가 일치하지 않습니다");
            return;
        }
        if (!isIdAvailable) {
            Alert.alert("오류", "ID 중복확인을 해주세요");
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch("http://3.106.58.224:3000/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (data.message === "signup success") {
                Alert.alert("성공", "회원가입이 완료되었습니다. 로그인해주세요", [
                    { text: "확인", onPress: () => setIsLogin(true) },
                ]);
            } else {
                Alert.alert("오류", data.message || "회원가입 실패");
            }
        } catch (error) {
            Alert.alert("오류", "회원가입 중 문제가 발생했습니다");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert("오류", "아이디와 비밀번호를 모두 입력해주세요");
            return;
        }
        setIsLoading(true);
        try {
            console.log('로그인 시도:', username);

            const response = await fetch("http://3.106.58.224:3000/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            // HTTP 상태 코드 로깅
            console.log('로그인 응답 상태 코드:', response.status);

            const data = await response.json();

            // 전체 응답 데이터 로깅
            console.log('로그인 응답 데이터:', JSON.stringify(data));

            if (data.access_token) {
                console.log('토큰 수신 성공:', data.access_token.substring(0, 20) + '...');
                console.log('세션ID 포함 여부:', data.sessionId ? '포함' : '미포함');

                // 로그인 상태 업데이트 - 이 부분을 먼저 실행
                setIsLoggedIn(true);
                console.log('로그인 상태 true로 업데이트');

                // 토큰 저장
                await AsyncStorage.setItem("access_token", data.access_token);

                // sessionId가 존재하면 저장
                if (data.sessionId) {
                    await AsyncStorage.setItem("current_session_id", data.sessionId.toString());
                    console.log('로그인 성공 - 기존 세션ID 저장됨:', data.sessionId);
                } else {
                    // 기존 세션ID가 있으면 유지, 없으면 null 상태로 둠
                    const existingSessionId = await AsyncStorage.getItem("current_session_id");
                    console.log('로그인 성공 - 세션ID 없음. 기존 세션ID:', existingSessionId || 'null');
                }

                // AsyncStorage 내용 확인용 디버깅 로그
                const storedToken = await AsyncStorage.getItem("access_token");
                const storedSessionId = await AsyncStorage.getItem("current_session_id");
                console.log('저장된 토큰 확인:', storedToken ? '있음' : '없음');
                console.log('저장된 세션ID 확인:', storedSessionId || 'null');

                // 상태 업데이트 후 약간의 지연 추가
                await new Promise(resolve => setTimeout(resolve, 100));

                // 로그인 성공 시 채팅만 초기화하고 세션은 생성하지 않음
                await clearChatOnly();

                // TTS가 실행 중이면 중지
                if (Speech && Speech.stop) {
                    Speech.stop();
                }

                Alert.alert("성공", "로그인이 완료되었습니다", [
                    {
                        text: "확인",
                        onPress: () => {
                            Keyboard.dismiss();
                            setTimeout(() => {
                                navigation.navigate("Main");
                            }, 50);
                        },
                    },
                ]);
            } else {
                console.log('로그인 실패: 토큰 없음');
                Alert.alert("오류", "아이디 또는 비밀번호가 일치하지 않습니다");
            }
        } catch (error) {
            console.error('로그인 요청 오류:', error);
            Alert.alert("오류", "로그인 중 문제가 발생했습니다");
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
                                    {isLogin ? (isLoading ? "로그인 중..." : "Login") : "Sign Up"}
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
