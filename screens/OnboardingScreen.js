import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
    StatusBar,
    TouchableOpacity,
    FlatList,
    SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// 온보딩 데이터
const onboardingData = [
    {
        id: '1',
        title: 'Explore the App',
        image: require('../assets/onboarding/image 33.png'),
    },
    {
        id: '2',
        title: 'Chat with Trabuddy',
        image: require('../assets/onboarding/image 34.png'),
    },
    {
        id: '3',
        title: 'Discover History & Culture',
        image: require('../assets/onboarding/image 35.png'),
    },
    {
        id: '4',
        title: 'Personalized Recommendations',
        image: require('../assets/onboarding/image 36.png'),
    },
    {
        id: '5',
        image: require('../assets/splash/grandparents.png'),
        title: 'Welcome to Trabuddy,',
        description: 'your smart travel companion \nthat enhances the quality of \nyour journey.\nAre you ready to enjoy \nyour travels with Trabuddy?',
        isFinalPage: true
    }
];

export default function OnboardingScreen({ navigation }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);

    // 다음 슬라이드로 이동
    const goToNextSlide = () => {
        if (currentIndex < onboardingData.length - 1) {
            flatListRef.current.scrollToIndex({
                index: currentIndex + 1,
                animated: true
            });
        }
    };

    // 이전 슬라이드로 이동
    const goToPrevSlide = () => {
        if (currentIndex > 0) {
            flatListRef.current.scrollToIndex({
                index: currentIndex - 1,
                animated: true
            });
        }
    };

    // 온보딩 완료 및 메인 화면으로 이동
    const finishOnboarding = async () => {
        try {
            // 개발 중에는 온보딩 완료 상태를 저장하지 않음
            // 실제 앱 출시 시 아래 주석을 해제하면 됩니다.
            // await AsyncStorage.setItem('has_seen_onboarding', 'true');

            // 메인 화면으로 이동
            navigation.replace('Main');

            console.log('온보딩 확인 완료 및 메인 화면으로 이동 (개발 모드: 온보딩 상태 저장 안함)');
        } catch (error) {
            console.error('온보딩 상태 저장 오류:', error);
            // 오류가 발생해도 메인 화면으로 이동
            navigation.navigate('Main');
        }
    };

    // 스크롤 이벤트 처리
    const handleViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    // 온보딩 슬라이드 렌더링
    const renderItem = ({ item, index }) => {
        if (item.isFinalPage) {
            // 마지막 페이지 (시작 버튼이 있는 페이지) - 설명 유지
            return (
                <View style={styles.slide}>
                    <LinearGradient
                        colors={['#D4F9FA', '#B2E4FF']}
                        style={styles.gradientBackground}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                    >
                        <Image
                            source={item.image}
                            style={styles.finalImage}
                            resizeMode="contain"
                        />
                        <View style={styles.finalTextContainer}>
                            <Text style={styles.finalTitle}>{item.title}</Text>
                            <Text style={styles.finalDescription}>{item.description}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={finishOnboarding}
                        >
                            <Text style={styles.startButtonText}>Start Now!</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            );
        }

        // 다른 온보딩 페이지들 - 제목만 표시
        return (
            <View style={styles.slide}>
                <LinearGradient
                    colors={['#D4F9FA', '#B2E4FF']}
                    style={styles.gradientBackground}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                >
                    <View style={styles.contentContainer}>
                        <View style={styles.imageContainer}>
                            <Image
                                source={item.image}
                                style={styles.screenImage}
                                resizeMode="contain"
                            />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.slideTitle}>{item.title}</Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>
        );
    };

    // 페이지 인디케이터 렌더링
    const renderPagination = () => {
        return (
            <View style={styles.paginationContainer}>
                {onboardingData.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.paginationDot,
                            index === currentIndex ? styles.paginationDotActive : null
                        ]}
                    />
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" />

            <FlatList
                ref={flatListRef}
                data={onboardingData}
                renderItem={renderItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                bounces={false}
                keyExtractor={item => item.id}
                onViewableItemsChanged={handleViewableItemsChanged}
                viewabilityConfig={{
                    itemVisiblePercentThreshold: 50
                }}
            />

            {renderPagination()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    slide: {
        width,
        height,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    gradientBackground: {
        width,
        height,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        paddingHorizontal: 20,
    },
    contentContainer: {
        flex: 1,
        width: width,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 20,
    },
    imageContainer: {
        width: width,
        height: height * 0.7,
        alignItems: 'center',
        justifyContent: 'center',
    },
    screenImage: {
        width: width,
        height: height * 0.7,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    textContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 0,
        height: 80,
    },
    slideTitle: {
        fontFamily: 'Outfit',
        fontSize: 28,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 10,
        marginTop: 30,
    },
    finalImage: {
        width: width * 0.6,
        height: height * 0.3,
        marginTop: -30,
    },
    finalTextContainer: {
        marginTop: 20,
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    finalTitle: {
        fontFamily: 'Outfit',
        fontSize: 24,
        fontWeight: '600',
        color: '#8C8C8C',
        textAlign: 'center',
        marginBottom: 10,
    },
    finalDescription: {
        fontFamily: 'Outfit',
        fontSize: 20,
        fontWeight: '600',
        color: '#8C8C8C',
        textAlign: 'center',
        lineHeight: 30,
    },
    startButton: {
        backgroundColor: '#E9FEFF',
        paddingVertical: 15,
        paddingHorizontal: 60,
        borderRadius: 40,
        marginTop: 40,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.25,
        shadowRadius: 2,
        elevation: 5,
    },
    startButtonText: {
        fontFamily: 'Outfit',
        fontSize: 32,
        fontWeight: '700',
        color: '#515151',
        textAlign: 'center',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 100,
        width: '100%',
        backgroundColor: 'transparent',
    },
    paginationDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(22, 159, 232, 0.3)',
        marginHorizontal: 8,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
        overflow: 'hidden',
    },
    paginationDotActive: {
        backgroundColor: 'rgba(22, 159, 232, 0.8)',
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 0,
        borderColor: 'transparent',
    },
}); 