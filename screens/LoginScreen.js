import React, { useState } from 'react';
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
    StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';

export default function LoginScreen({ navigation }) {
    const [isLogin, setIsLogin] = useState(true); // true: 로그인, false: 회원가입
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const toggleMode = () => {
        setIsLogin(!isLogin);
        // 입력 필드 초기화
        setEmail('');
        setPassword('');
        setConfirmPassword('');
    };

    const handleAction = () => {
        if (isLogin) {
            // 로그인 처리 로직
            console.log('Login with:', email, password);
            // 성공 시 메인 화면으로 이동
            navigation.navigate('Main');
        } else {
            // 회원가입 처리 로직
            console.log('Sign up with:', email, password, confirmPassword);
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
            // 가입 후 로그인 화면으로 전환
            setIsLogin(true);
        }
    };

    return (
        <LinearGradient
            colors={['#B2E4FF', '#FFFFFF']}
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
                            {isLogin ? 'Welcome Back!' : 'Create Account'}
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
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
                            style={styles.actionButton}
                            onPress={handleAction}
                        >
                            <LinearGradient
                                colors={['#40ABE5', '#528099']}
                                style={styles.actionButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.actionButtonText}>
                                    {isLogin ? 'Login' : 'Sign Up'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.switchModeContainer}>
                            <Text style={styles.switchModeText}>
                                {isLogin ? "Don't have an account?" : "Already have an account?"}
                            </Text>
                            <TouchableOpacity onPress={toggleMode}>
                                <Text style={styles.switchModeButton}>
                                    {isLogin ? 'Sign Up' : 'Login'}
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
        justifyContent: 'center',
    },
    title: {
        fontFamily: 'OriginalSurfer',
        fontSize: 28,
        marginBottom: 30,
        color: '#333',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    inputLabel: {
        fontFamily: 'Outfit',
        fontSize: 16,
        marginBottom: 8,
        color: '#333',
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontFamily: 'Outfit',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    passwordContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        alignItems: 'center',
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontFamily: 'Outfit',
        fontSize: 16,
    },
    eyeIcon: {
        padding: 10,
    },
    forgotPasswordContainer: {
        alignSelf: 'flex-end',
        marginBottom: 25,
    },
    forgotPassword: {
        fontFamily: 'Outfit',
        fontSize: 14,
        color: '#40ABE5',
    },
    actionButton: {
        width: '100%',
        height: 55,
        borderRadius: 15,
        overflow: 'hidden',
        marginBottom: 20,
    },
    actionButtonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtonText: {
        fontFamily: 'OriginalSurfer',
        fontSize: 20,
        color: '#FFFFFF',
    },
    switchModeContainer: {
        flexDirection: 'row',
        marginTop: 10,
    },
    switchModeText: {
        fontFamily: 'Outfit',
        fontSize: 16,
        color: '#666',
    },
    switchModeButton: {
        fontFamily: 'Outfit',
        fontSize: 16,
        color: '#40ABE5',
        fontWeight: 'bold',
        marginLeft: 5,
    },
}); 