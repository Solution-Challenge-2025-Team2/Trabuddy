import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
    StatusBar,
    Animated,
    ImageBackground
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
    // 애니메이션 값
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        // 애니메이션 시작
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();

        // 2.5초 후에 다음 화면으로 자동 이동
        const timer = setTimeout(() => {
            // 다음 화면으로 이동
            checkOnboardingStatus();
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    // 온보딩 상태 확인 함수
    const checkOnboardingStatus = async () => {
        try {
            // 다음 화면으로 이동
            navigation.replace('AppStartup');
        } catch (error) {
            console.error('스플래시 화면 네비게이션 오류:', error);
            // 오류 발생 시 메인 화면으로 이동
            navigation.replace('Main');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" />
            <LinearGradient
                colors={['#D4F9FA', '#B2E4FF']}
                style={styles.background}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            >
                <View style={styles.content}>
                    <View style={styles.imageContainer}>
                        <Image
                            source={require('../assets/splash/grandparents.png')}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    </View>
                    <Animated.View
                        style={[
                            styles.logoContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }],
                            },
                        ]}
                    >
                        <Text style={styles.title}>Trabuddy</Text>
                    </Animated.View>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        flex: 1,
        borderRadius: 30,
        overflow: 'hidden',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    imageContainer: {
        width: width * 0.5,
        height: height * 0.3,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    title: {
        fontSize: 48,
        fontFamily: 'OriginalSurfer',
        color: 'black',
        textAlign: 'center',
    },
}); 