import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    SafeAreaView,
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }) {
    const finishOnboarding = async () => {
        try {
            // 온보딩 완료 상태를 저장
            await AsyncStorage.setItem('has_seen_onboarding', 'true');

            // 메인 화면으로 이동 (back 버튼으로 온보딩 화면으로 돌아오지 않도록 replace 사용)
            navigation.replace('Main');

            console.log('온보딩 완료 및 메인 화면으로 이동');
        } catch (error) {
            console.error('온보딩 상태 저장 오류:', error);
            Alert.alert(
                '오류',
                '설정을 저장하는 중 문제가 발생했습니다. 앱을 다시 시작해주세요.',
                [{
                    text: '확인',
                    onPress: () => navigation.navigate('Main')
                }]
            );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#1A237E', '#311B92']}
                style={styles.background}
            >
                <View style={styles.content}>
                    <Image
                        source={require('../assets/icon.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />

                    <Text style={styles.title}>Trabuddy에 오신 것을 환영합니다!</Text>
                    <Text style={styles.subtitle}>
                        여행 준비부터 도착까지, 당신의 여행 친구가 되어드립니다
                    </Text>

                    <View style={styles.featureContainer}>
                        <FeatureItem
                            title="여행 정보 제공"
                            description="목적지의 문화, 역사, 관광지 정보를 제공합니다"
                        />
                        <FeatureItem
                            title="여행 준비물 추천"
                            description="당신의 여행에 필요한 준비물을 추천해 드립니다"
                        />
                        <FeatureItem
                            title="맞춤형 여행 도우미"
                            description="AI 기반 개인 맞춤형 여행 정보를 제공합니다"
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={finishOnboarding}
                    >
                        <Text style={styles.buttonText}>시작하기</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </SafeAreaView>
    );
}

const FeatureItem = ({ title, description }) => (
    <View style={styles.featureItem}>
        <View style={styles.featureIcon}>
            <Text style={styles.featureIconText}>✓</Text>
        </View>
        <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureDescription}>{description}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    logo: {
        width: width * 0.4,
        height: width * 0.4,
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 10,
        fontFamily: 'Outfit',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginBottom: 40,
        fontFamily: 'Outfit',
    },
    featureContainer: {
        width: '100%',
        marginBottom: 40,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    featureIconText: {
        fontSize: 20,
        color: 'white',
    },
    featureTextContainer: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 5,
        fontFamily: 'Outfit',
    },
    featureDescription: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontFamily: 'Outfit',
    },
    button: {
        backgroundColor: 'white',
        paddingVertical: 15,
        paddingHorizontal: 60,
        borderRadius: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A237E',
        fontFamily: 'Outfit',
    },
}); 