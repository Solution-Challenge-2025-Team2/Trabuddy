import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AppStartupScreen({ navigation }) {
    // 컴포넌트 마운트 시 온보딩 상태 확인
    useEffect(() => {
        checkOnboardingStatus();
    }, []);

    // 온보딩 상태 확인 함수
    const checkOnboardingStatus = async () => {
        try {
            // 온보딩 상태 확인
            const hasSeenOnboarding = await AsyncStorage.getItem('has_seen_onboarding');

            if (hasSeenOnboarding === 'true') {
                // 온보딩을 이미 봤으면 메인 화면으로 이동
                navigation.replace('Main');
            } else {
                // 온보딩을 아직 안 봤으면 온보딩 화면으로 이동
                navigation.replace('Onboarding');
            }
        } catch (error) {
            console.error('앱 시작 상태 확인 오류:', error);
            // 오류 발생 시 메인 화면으로 이동
            navigation.replace('Main');
        }
    };

    // 로딩 표시 화면
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#1A237E" />
            <Text style={styles.text}>로딩 중...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    text: {
        marginTop: 10,
        fontSize: 16,
        color: '#333',
    }
}); 