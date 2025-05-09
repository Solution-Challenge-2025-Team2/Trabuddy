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
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
    const [isLogin, setIsLogin] = useState(true); // true: 로그인, false: 회원가입
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const toggleMode = () => {
        setIsLogin(!isLogin);
        // 입력 필드 초기화
        setUsername("");
        setPassword("");
        setConfirmPassword("");
    };

    const handleAction = async () => {
        if (isLogin) {
            // 로그인 처리 로직
            if (!username || !password) {
                Alert.alert("오류", "아이디와 비밀번호를 모두 입력해주세요");
                return;
            }

            setIsLoading(true);
            Keyboard.dismiss(); // 키보드 내리기

            try {
                // 임시 로그인 검증 (실제로는 API 호출)
                if (username === "kmj200392" && password === "kmj200392") {
                    // 임시 액세스 토큰 생성 (실제로는 서버에서 받아옴)
                    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockToken";

                    // AsyncStorage에 토큰 저장
                    await AsyncStorage.setItem('access_token', mockToken);

                    // 성공 메시지
                    Alert.alert("성공", "로그인이 완료되었습니다", [
                        {
                            text: "확인", onPress: () => {
                                Keyboard.dismiss(); // 키보드 내리기
                                // 키보드가 완전히 내려간 후 네비게이션
                                setTimeout(() => {
                                    navigation.navigate("Main");
                                }, 50); // 50ms 지연
                            }
                        }
                    ]);
                } else {
                    // 로그인 실패
                    Alert.alert("오류", "아이디 또는 비밀번호가 일치하지 않습니다");
                }
            } catch (error) {
                console.error("로그인 오류:", error);
                Alert.alert("오류", "로그인 중 문제가 발생했습니다");
            } finally {
                setIsLoading(false);
            }
        } else {
            // 회원가입 처리 로직
            if (!username || !password || !confirmPassword) {
                Alert.alert("오류", "모든 필드를 입력해주세요");
                return;
            }

            if (password !== confirmPassword) {
                Alert.alert("오류", "비밀번호가 일치하지 않습니다");
                return;
            }

            // 실제 API 구현 전에는 회원가입 성공 메시지만 표시
            Keyboard.dismiss(); // 키보드 내리기
            Alert.alert("성공", "회원가입이 완료되었습니다. 로그인해주세요", [
                { text: "확인", onPress: () => setIsLogin(true) }
            ]);
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
                                onChangeText={setUsername}
                                autoCapitalize="none"
                            />
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

                        {isLogin && (
                            <View style={styles.testAccountContainer}>
                                <Text style={styles.testAccountTitle}>테스트 계정</Text>
                                <Text style={styles.testAccountText}>ID: kmj200392</Text>
                                <Text style={styles.testAccountText}>Password: kmj200392</Text>
                            </View>
                        )}
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
        fontWeight: "bold",
        marginLeft: 5,
    },
    testAccountContainer: {
        marginTop: 30,
        padding: 15,
        borderRadius: 10,
        backgroundColor: 'rgba(64, 171, 229, 0.1)',
        alignItems: 'center',
    },
    testAccountTitle: {
        fontFamily: "Outfit",
        fontSize: 16,
        fontWeight: 'bold',
        color: '#40ABE5',
        marginBottom: 8,
    },
    testAccountText: {
        fontFamily: "Outfit",
        fontSize: 14,
        color: '#555',
        marginBottom: 4,
    },
});
