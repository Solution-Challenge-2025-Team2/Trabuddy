import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Platform,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Animated,
  ActivityIndicator,
  SafeAreaView,
  PanResponder,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Frame from "../Frame";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from "expo-speech";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.85;

// 역사/문화 데이터 알림 메시지 컴포넌트
const HistoricalNotification = ({ onPress, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 알림 표시 애니메이션
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // 5초 후 자동으로 사라짐
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      if (onDismiss) onDismiss();
    });
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        backgroundColor: FIGMA_COLORS.accentBlue,
        borderRadius: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 1000,
        opacity: fadeAnim,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontFamily: 'Outfit', fontSize: 16, fontWeight: '500' }}>
            New history/culture information available
          </Text>
          <Text style={{ color: '#e0f0ff', fontFamily: 'Outfit', fontSize: 14, marginTop: 4 }}>
            Tap to see details
          </Text>
        </View>
        <TouchableOpacity onPress={handleDismiss} style={{ padding: 5 }}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        activeOpacity={0.7}
        onPress={() => {
          handleDismiss();
          if (onPress) onPress();
        }}
      />
    </Animated.View>
  );
};

// 피그마에서 가져온 색상
const FIGMA_COLORS = {
  backgroundGradientStart: "#B2E4FF",
  backgroundGradientEnd: "#FFFFFF",
  primaryText: "#000000",
  secondaryText: "rgba(0, 0, 0, 0.5)",
  accentBlue: "#00527E",
  cardBackground: "#FFFFFF",
  filterBackground: "#9BB9CA",
  notificationIcon: "#353535",
  iconBackground: "#6DC0ED",
  white: "#FFFFFF",
};

export default function HistoryDetailScreen({ navigation, route }) {
  const [historicalData, setHistoricalData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [speaking, setSpeaking] = useState(""); // TTS 상태 관리를 위한 상태 추가

  // 역사/문화 데이터 존재 여부 상태
  const [savedHistoricalExist, setSavedHistoricalExist] = useState(false);

  // 새 역사/문화 데이터 알림 표시 상태
  const [showNotification, setShowNotification] = useState(false);
  const [hasNewData, setHasNewData] = useState(false);
  const [lastDataTimestamp, setLastDataTimestamp] = useState(0);

  // 여러 역사/문화 목록을 관리하기 위한 상태 추가
  const [allHistoricalData, setAllHistoricalData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 모달 슬라이드 애니메이션
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const modalPosition = useRef(new Animated.Value(0)).current;

  // 모달 Pan Responder 설정
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        modalPosition.setValue(0);
      },
      onPanResponderMove: (event, gestureState) => {
        // 아래로 드래그 할 때만 값 변경 (위로는 더 이상 올라가지 않도록)
        if (gestureState.dy > 0) {
          modalPosition.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (event, gestureState) => {
        // 일정 거리 이상 드래그하면 닫기, 아니면 원래 위치로
        if (gestureState.dy > 100) { // 더 민감하게 조정
          console.log('충분히 드래그됨, 모달 닫기');
          closeModal();
        } else {
          console.log('충분히 드래그되지 않음, 원래 위치로');
          Animated.spring(modalPosition, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 8
          }).start();
        }
      }
    })
  ).current;

  // summary 애니메이션
  const summaryHeight = useRef(new Animated.Value(0)).current;

  // 컴포넌트 마운트 시 실행
  useEffect(() => {
    const initializeScreen = async () => {
      // 로컬 저장소에서 역사/문화 데이터 불러오기
      await loadAllHistoricalData();

      // 라우트 파라미터 처리
      await handleRouteParams();

      // 새 데이터 체크
      await checkForNewData();

      // 글로벌 이벤트 리스너 설정
      setupGlobalEventListener();

      // 항상 알림 비활성화 (사이드바에서 진입하는 경우도 알림 표시하지 않음)
      setShowNotification(false);
      setHasNewData(false);

      // 기본적으로 summary는 접혀있는 상태로 시작
      setIsSummaryExpanded(false);
      summaryHeight.setValue(0);
    };

    initializeScreen();

    // 언마운트 시 이벤트 리스너 정리
    return () => {
      if (global.dispatchHistoricalDataEvent) {
        delete global.dispatchHistoricalDataEvent;
      }
    };
  }, []);

  // 모달 상태 변경 시 애니메이션 효과
  useEffect(() => {
    if (modalVisible) {
      console.log('모달 열림 - 애니메이션 시작');
      // 모달이 나타날 때 애니메이션
      slideAnim.setValue(SCREEN_HEIGHT); // 화면 높이만큼 아래에서 시작
      modalPosition.setValue(0); // 모달 위치 초기화

      // 약간의 지연 후 애니메이션 실행 (레이아웃 계산 시간 확보)
      setTimeout(() => {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 30, // 낮은 장력
          friction: 8, // 높은 마찰력
          restDisplacementThreshold: 10,
          restSpeedThreshold: 10
        }).start(() => {
          console.log('모달 열림 애니메이션 완료');
        });
      }, 50);
    }
  }, [modalVisible]);

  // 새 데이터 확인
  const checkForNewData = async () => {
    // 모든 경로에서 알림 비활성화
    setShowNotification(false);
    setHasNewData(false);

    try {
      const dataExists = await AsyncStorage.getItem('historical_data_exists');

      if (dataExists === 'true') {
        setSavedHistoricalExist(true);

        // 마지막 데이터 타임스탬프 확인
        const lastTimestamp = await AsyncStorage.getItem('historical_data_timestamp');
        const currentLastTimestamp = lastTimestamp ? parseInt(lastTimestamp) : 0;

        // 이전에 저장된 타임스탬프와 비교
        if (currentLastTimestamp > lastDataTimestamp) {
          setLastDataTimestamp(currentLastTimestamp);
          // 알림 비활성화 상태 유지
        }
      }
    } catch (error) {
      console.error('새 역사/문화 데이터 확인 중 오류:', error);
    }
  };

  // 다음 목록으로 이동
  const goToNextList = () => {
    if (currentIndex < allHistoricalData.length - 1) {
      setCurrentIndex(prevIndex => {
        const newIndex = prevIndex + 1;
        setHistoricalData(allHistoricalData[newIndex]);
        return newIndex;
      });
    }
  };

  // 이전 목록으로 이동
  const goToPrevList = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => {
        const newIndex = prevIndex - 1;
        setHistoricalData(allHistoricalData[newIndex]);
        return newIndex;
      });
    }
  };

  // 모든 역사/문화 데이터 로드
  const loadAllHistoricalData = async () => {
    try {
      setIsLoadingData(true);

      // AsyncStorage의 모든 키 가져오기
      const keys = await AsyncStorage.getAllKeys();
      const histKeys = keys.filter(key => key.startsWith('hist_data_'));

      console.log(`역사/문화 데이터 키 ${histKeys.length}개 발견`);

      if (histKeys.length > 0) {
        // 역사/문화 데이터 존재 플래그 설정
        setSavedHistoricalExist(true);

        // 모든 역사/문화 데이터 로드
        const dataArray = [];

        for (const key of histKeys) {
          try {
            const value = await AsyncStorage.getItem(key);
            if (value) {
              const parsedData = JSON.parse(value);

              // 유효한 데이터인지 확인
              if (parsedData && parsedData.category === 'historical' && parsedData.message) {
                // 데이터에 키 추가
                if (!parsedData.key) {
                  parsedData.key = key;
                }

                // 타임스탬프 확인 및 추가
                if (!parsedData.timestamp && key.includes('_')) {
                  const timestampStr = key.split('_')[1];
                  if (timestampStr && !isNaN(parseInt(timestampStr))) {
                    parsedData.timestamp = parseInt(timestampStr);
                    parsedData.timestampStr = new Date(parseInt(timestampStr)).toLocaleString();
                  }
                }

                dataArray.push(parsedData);
              }
            }
          } catch (error) {
            console.error(`역사/문화 데이터 로드 중 오류 (${key}):`, error);
          }
        }

        // 타임스탬프 기준 정렬 (최신순)
        dataArray.sort((a, b) => {
          const timeA = a.timestamp || 0;
          const timeB = b.timestamp || 0;
          return timeB - timeA;
        });

        console.log(`${dataArray.length}개의 역사/문화 데이터 정렬 완료`);

        setAllHistoricalData(dataArray);

        // 첫 번째 데이터로 상태 설정
        if (dataArray.length > 0) {
          setHistoricalData(dataArray[0]);
          setCurrentIndex(0);
        }
      } else {
        console.log('저장된 역사/문화 데이터가 없습니다.');
      }
    } catch (error) {
      console.error('역사/문화 데이터 로드 중 오류:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // 특정 역사/문화 데이터 찾기 및 표시
  const findAndShowHistoricalData = (dataToFind) => {
    if (!dataToFind || !allHistoricalData.length) return;

    // 찾을 타임스탬프
    const timestampToFind = dataToFind.timestamp;

    if (timestampToFind) {
      const index = allHistoricalData.findIndex(item => item.timestamp === timestampToFind);
      if (index !== -1) {
        setHistoricalData(allHistoricalData[index]);
        setCurrentIndex(index);
      }
    }
  };

  // 라우트 파라미터 처리
  const handleRouteParams = async () => {
    if (route.params) {
      // View More Details에서 들어온 경우 알림 비활성화
      // 메시지 데이터가 있고 messageId 파라미터가 있으면 View More Details에서 들어온 것으로 간주
      if (route.params.messageId) {
        // View More Details에서 진입한 경우, 알림을 표시하지 않음
        setShowNotification(false);
        setHasNewData(false);
      }

      // 메시지 데이터가 있는 경우
      if (route.params.messageData) {
        console.log('라우트 파라미터로 메시지 데이터 수신:', route.params.messageData.category);

        // 데이터가 유효한지 확인
        const receivedData = route.params.messageData;

        if (receivedData.category === 'historical' && receivedData.message) {
          console.log('유효한 역사/문화 데이터 수신');

          // 리스트에 없는 경우 추가
          if (!allHistoricalData.some(item => item.timestamp === receivedData.timestamp)) {
            console.log('새 역사/문화 데이터 추가');
            const updatedList = [receivedData, ...allHistoricalData];
            setAllHistoricalData(updatedList);
            setHistoricalData(receivedData);
            setCurrentIndex(0);

            // View More Details에서 들어온 경우 알림 비활성화
            if (route.params.messageId) {
              setShowNotification(false);
              setHasNewData(false);
            }
          } else {
            // 이미 목록에 있는 경우 해당 항목 표시
            findAndShowHistoricalData(receivedData);
          }
        } else if (route.params.timestamp) {
          // 타임스탬프만 있는 경우, 해당 타임스탬프로 데이터 찾기
          const histDataKey = `hist_data_${route.params.timestamp}`;
          try {
            const histDataStr = await AsyncStorage.getItem(histDataKey);
            if (histDataStr) {
              const histData = JSON.parse(histDataStr);
              findAndShowHistoricalData(histData);
            }
          } catch (error) {
            console.error('타임스탬프로 역사/문화 데이터 로드 중 오류:', error);
          }
        }
      } else if (route.params.timestamp) {
        // 타임스탬프만 있는 경우, 해당 타임스탬프로 데이터 찾기
        const histDataKey = `hist_data_${route.params.timestamp}`;
        try {
          const histDataStr = await AsyncStorage.getItem(histDataKey);
          if (histDataStr) {
            const histData = JSON.parse(histDataStr);
            findAndShowHistoricalData(histData);
          }
        } catch (error) {
          console.error('타임스탬프로 역사/문화 데이터 로드 중 오류:', error);
        }
      }
    } else {
      // 파라미터가 없는 경우, 최신 역사/문화 데이터 불러오기
      try {
        const latestHistKeyStr = await AsyncStorage.getItem('latest_historical_data_key');
        if (latestHistKeyStr) {
          const histDataStr = await AsyncStorage.getItem(latestHistKeyStr);
          if (histDataStr) {
            const histData = JSON.parse(histDataStr);
            findAndShowHistoricalData(histData);
          }
        }
      } catch (error) {
        console.error('최신 역사/문화 데이터 로드 중 오류:', error);
      }
    }
  };

  // 글로벌 이벤트 리스너 설정
  const setupGlobalEventListener = () => {
    global.dispatchHistoricalDataEvent = (newData) => {
      console.log('역사/문화 데이터 이벤트 수신:', newData.category);

      if (newData && newData.category === 'historical' && newData.message) {
        // 새 데이터를 목록 맨 앞에 추가
        setAllHistoricalData(prevList => {
          // 이미 존재하는 데이터인지 확인
          if (!prevList.some(item => item.timestamp === newData.timestamp)) {
            const newList = [newData, ...prevList];

            // 현재 데이터 업데이트
            setHistoricalData(newData);
            setCurrentIndex(0);

            // 알림 비활성화 (사이드바에서 진입하는 경우도 알림 표시하지 않음)
            setShowNotification(false);

            return newList;
          }
          return prevList;
        });
      }
    };
  };

  // 모달 애니메이션 함수 추가
  const openModal = () => {
    console.log('시대 선택:', selectedPeriod);
    console.log('오픈 모달 함수 호출됨');
    console.log('화면 높이:', SCREEN_HEIGHT);

    // 선택된 시대 데이터 디버깅
    if (selectedPeriod && historicalData && historicalData.message) {
      console.log('선택된 시대 데이터 확인:',
        historicalData.message[selectedPeriod] ? '데이터 있음' : '데이터 없음');

      // 데이터 구조 확인
      if (historicalData.message[selectedPeriod]) {
        console.log('시대 설명:', getPeriodData(selectedPeriod, '시대_설명') || '없음');
        console.log('주요 사건:', getPeriodData(selectedPeriod, '주요_사건') ? '있음' : '없음');
      }
    }

    // 모달 표시
    setModalVisible(true);
  };

  const closeModal = () => {
    console.log('클로즈 모달 함수 호출됨');
    // 모달이 사라지는 애니메이션 실행
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT, // 화면 높이만큼 아래로 사라짐
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      // 애니메이션 완료 후 모달 숨김
      console.log('모달 닫힘 애니메이션 완료');
      setModalVisible(false);
      // 모달 위치 초기화
      modalPosition.setValue(0);
    });
  };

  // 시대별 데이터 가져오기 헬퍼 함수
  const getPeriodData = (period, field) => {
    if (!period || !historicalData || !historicalData.message || !historicalData.message[period]) {
      return null;
    }

    // 한국어와 영어 필드 매핑
    const fieldMappings = {
      // 시대 설명
      '시대_설명': ['시대_설명', '시대 설명', 'Description'],
      // 주요 사건
      '주요_사건': ['주요_사건', '주요 사건', 'Major Events'],
      // 중요 인물
      '중요_인물': ['중요_인물', '중요 인물', 'Important Figures'],
      // 문화적 특징
      '문화적_특징': ['문화적_특징', '문화적 특징', 'Cultural Characteristics']
    };

    // 매핑된 필드들 중에서 데이터가 있는 것을 반환
    const mappings = fieldMappings[field] || [field];
    for (const key of mappings) {
      if (historicalData.message[period][key] !== undefined &&
        historicalData.message[period][key] !== null) {
        return historicalData.message[period][key];
      }
    }

    return null;
  };

  // 특정 항목 내의 필드 가져오기 헬퍼 함수 (이벤트, 인물 등의 제목과 설명)
  const getItemField = (item, field) => {
    if (!item) return null;

    // 필드 매핑
    const fieldMappings = {
      '이름': ['이름', 'name', 'Title'],
      '설명': ['설명', 'description', 'Description']
    };

    // 매핑된 필드들 중에서 데이터가 있는 것을 반환
    const mappings = fieldMappings[field] || [field];
    for (const key of mappings) {
      if (item[key] !== undefined && item[key] !== null) {
        return item[key];
      }
    }

    return null;
  };

  // TTS 기능 추가
  const speak = (text) => {
    if (speaking === text) {
      // 이미 같은 텍스트를 읽고 있다면 중지
      Speech.stop();
      setSpeaking("");
    } else {
      // 다른 텍스트 읽고 있다면
      Speech.stop(); // 현재 읽고 있는 텍스트 중지
      Speech.speak(text, {
        language: "en-US",
        rate: 0.9,
        pitch: 1.0,
      });
      setSpeaking(text); // 현재 읽고 있는 텍스트 저장
    }
  };

  return (
    <LinearGradient
      colors={[
        FIGMA_COLORS.backgroundGradientStart,
        FIGMA_COLORS.backgroundGradientEnd,
      ]}
      style={styles.gradient}
      start={{ x: 0.5, y: 0.17 }}
      end={{ x: 0.5, y: 0.65 }}
    >
      <Frame>
        <SafeAreaView style={styles.container}>
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate("Main")}
            >
              <Ionicons name="chevron-back" size={30} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerText}>History Details</Text>
            <View style={styles.spacer} />
          </View>

          {isLoadingData ? (
            // 로딩 인디케이터
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#40ABE5" />
              <Text style={styles.loadingText}>Loading history/culture data...</Text>
            </View>
          ) : !historicalData ? (
            // 데이터가 없는 경우
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>
                No saved history/culture data.
              </Text>
              <Text style={styles.noDataSubText}>
                Ask Trabuddy for history/culture information!
              </Text>
            </View>
          ) : (
            // 역사/문화 데이터 표시
            <View style={styles.dataContainer}>
              {/* 페이지 이동 버튼 */}
              {allHistoricalData.length > 1 && (
                <View style={styles.navigationButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.navigationButton, currentIndex === 0 && styles.disabledButton]}
                    onPress={goToPrevList}
                    disabled={currentIndex === 0}
                  >
                    <Ionicons name="chevron-back" size={24} color={currentIndex === 0 ? "#ccc" : "#40ABE5"} />
                    <Text style={[styles.navigationButtonText, currentIndex === 0 && styles.disabledButtonText]}>Previous</Text>
                  </TouchableOpacity>

                  <Text style={styles.pageIndicator}>
                    {currentIndex + 1} / {allHistoricalData.length}
                  </Text>

                  <TouchableOpacity
                    style={[styles.navigationButton, currentIndex === allHistoricalData.length - 1 && styles.disabledButton]}
                    onPress={goToNextList}
                    disabled={currentIndex === allHistoricalData.length - 1}
                  >
                    <Text style={[styles.navigationButtonText, currentIndex === allHistoricalData.length - 1 && styles.disabledButtonText]}>Next</Text>
                    <Ionicons name="chevron-forward" size={24} color={currentIndex === allHistoricalData.length - 1 ? "#ccc" : "#40ABE5"} />
                  </TouchableOpacity>
                </View>
              )}

              {/* 역사/문화 데이터 헤더 */}
              <View style={styles.histDataHeader}>
                {historicalData.imageurl && (
                  <View style={styles.headerImageContainer}>
                    <Image
                      source={{ uri: historicalData.imageurl }}
                      style={styles.headerImage}
                      resizeMode="cover"
                    />
                  </View>
                )}

                <Text style={styles.histDataTitle}>
                  History/Culture Information
                </Text>

                {/* Summary 접기/펼치기 부분 */}
                <View style={styles.summaryContainer}>
                  <TouchableOpacity
                    style={styles.summaryHeader}
                    onPress={() => {
                      // 접기/펼치기 상태 변경
                      const newExpandedState = !isSummaryExpanded;
                      setIsSummaryExpanded(newExpandedState);

                      // 애니메이션 실행
                      Animated.timing(summaryHeight, {
                        toValue: newExpandedState ? 1 : 0,
                        duration: 300,
                        useNativeDriver: false,
                      }).start();
                    }}
                  >
                    <Text style={styles.summaryTitle}>Summary</Text>
                    <Ionicons
                      name={isSummaryExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#40ABE5"
                    />
                  </TouchableOpacity>

                  <Animated.View
                    style={[
                      styles.summaryContent,
                      {
                        maxHeight: summaryHeight.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 500]
                        }),
                        opacity: summaryHeight,
                        overflow: 'hidden',
                      }
                    ]}
                  >
                    <Text style={styles.histDataSubtitle}>
                      {historicalData.summary || "No history/culture information available."}
                    </Text>
                  </Animated.View>
                </View>

                <Text style={styles.histDataTimestamp}>
                  {historicalData.timestampStr || new Date().toLocaleString()}
                </Text>
              </View>

              {/* 시대 목록 */}
              <ScrollView style={styles.periodsContainer}>
                {historicalData.message && Object.keys(historicalData.message).map((period, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.periodItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      console.log('시대 터치:', period);
                      setSelectedPeriod(period);
                      setTimeout(() => {
                        openModal();
                      }, 100);
                    }}
                  >
                    <View style={styles.periodIconContainer}>
                      <LinearGradient
                        colors={['#40ABE5', '#2980b9']}
                        style={styles.periodIconBackground}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.periodIconText}>{period.charAt(0)}</Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.periodContentContainer}>
                      <View style={styles.periodHeader}>
                        <Text style={styles.periodTitle}>{period}</Text>
                        <Ionicons name="chevron-forward" size={20} color="#40ABE5" />
                      </View>
                      <Text style={styles.periodDescription} numberOfLines={2}>
                        {getPeriodData(period, '시대_설명') || "Click to see information about this period."}
                      </Text>
                      <View style={styles.periodTagsContainer}>
                        <View style={styles.periodTag}>
                          <Ionicons name="information-circle-outline" size={12} color="#40ABE5" />
                          <Text style={styles.periodTagText}>Details</Text>
                        </View>
                        {getPeriodData(period, '주요_사건') && (
                          <View style={styles.periodTag}>
                            <Ionicons name="calendar-outline" size={12} color="#40ABE5" />
                            <Text style={styles.periodTagText}>Events</Text>
                          </View>
                        )}
                        {getPeriodData(period, '중요_인물') && (
                          <View style={styles.periodTag}>
                            <Ionicons name="people-outline" size={12} color="#40ABE5" />
                            <Text style={styles.periodTagText}>Figures</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* 새 데이터 알림 */}
          {showNotification && (
            <HistoricalNotification
              onPress={() => {
                // 새 데이터로 이동
                if (allHistoricalData.length > 0) {
                  setHistoricalData(allHistoricalData[0]);
                  setCurrentIndex(0);
                }
                setShowNotification(false);
              }}
              onDismiss={() => setShowNotification(false)}
            />
          )}

          {/* 시대 상세 정보 모달 */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={closeModal}
            statusBarTranslucent={true}
            supportedOrientations={['portrait', 'landscape']}
            hardwareAccelerated={true}
          >
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={closeModal}>
                  <View style={styles.modalBackground} />
                </TouchableWithoutFeedback>
                <Animated.View
                  style={[
                    styles.modalContent,
                    {
                      transform: [
                        { translateY: slideAnim },
                        { translateY: modalPosition }
                      ]
                    }
                  ]}
                >
                  <View
                    {...panResponder.panHandlers}
                    style={styles.modalDragHandle}
                  >
                    <View style={styles.modalHeaderBar} />
                    <Text style={styles.modalDragHint}>Drag down to close</Text>
                  </View>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedPeriod}</Text>
                  </View>

                  <ScrollView
                    style={styles.modalBody}
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={styles.modalScrollContent}
                    nestedScrollEnabled={true}
                    bounces={false}
                    alwaysBounceVertical={false}
                    overScrollMode="never"
                    scrollEventThrottle={16}
                    keyboardShouldPersistTaps="handled"
                    persistentScrollbar={true}
                  >
                    {selectedPeriod && historicalData && historicalData.message && historicalData.message[selectedPeriod] ? (
                      <>
                        {/* 시대 설명 */}
                        <View style={styles.modalSection}>
                          <View style={styles.sectionTitleContainer}>
                            <Ionicons name="information-circle" size={24} color="#40ABE5" />
                            <Text style={styles.sectionTitle}>Period Description</Text>
                          </View>
                          <View style={styles.descriptionContainer}>
                            <Text style={styles.sectionText}>
                              {getPeriodData(selectedPeriod, '시대_설명') || "이 시대에 대한 설명이 없습니다."}
                            </Text>
                            <TouchableOpacity
                              onPress={() => speak(getPeriodData(selectedPeriod, '시대_설명') || "이 시대에 대한 설명이 없습니다.")}
                              style={styles.ttsButton}
                            >
                              <Ionicons
                                name={speaking === (getPeriodData(selectedPeriod, '시대_설명') || "이 시대에 대한 설명이 없습니다.") ? "stop" : "volume-high"}
                                size={16}
                                color="#40ABE5"
                              />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* 주요 사건 - 데이터 있는 경우만 표시 */}
                        {(() => {
                          const events = getPeriodData(selectedPeriod, '주요_사건');
                          return events && Array.isArray(events) && events.length > 0 && (
                            <View style={styles.modalSection}>
                              <View style={styles.sectionTitleContainer}>
                                <Ionicons name="calendar" size={24} color="#40ABE5" />
                                <Text style={styles.sectionTitle}>Important Events</Text>
                              </View>
                              <FlatList
                                data={events}
                                keyExtractor={(item, index) => `event_${index}`}
                                renderItem={({ item, index }) => {
                                  const title = getItemField(item, '이름') || `사건 ${index + 1}`;
                                  const description = getItemField(item, '설명') || "설명 정보가 없습니다.";
                                  const fullText = `${title}. ${description}`;
                                  return (
                                    <View style={styles.eventItem}>
                                      <View style={styles.eventNumberContainer}>
                                        <Text style={styles.eventNumber}>{index + 1}</Text>
                                      </View>
                                      <View style={styles.eventContent}>
                                        <Text style={styles.eventTitle}>
                                          {title}
                                        </Text>
                                        <View style={styles.eventDescriptionContainer}>
                                          <Text style={styles.eventDescription}>
                                            {description}
                                          </Text>
                                          <TouchableOpacity
                                            onPress={() => speak(fullText)}
                                            style={styles.ttsButton}
                                          >
                                            <Ionicons
                                              name={speaking === fullText ? "stop" : "volume-high"}
                                              size={16}
                                              color="#40ABE5"
                                            />
                                          </TouchableOpacity>
                                        </View>
                                      </View>
                                    </View>
                                  );
                                }}
                                scrollEnabled={false}
                                ItemSeparatorComponent={() => <View style={styles.eventSeparator} />}
                              />
                            </View>
                          );
                        })()}

                        {/* 중요 인물 - 데이터 있는 경우만 표시 */}
                        {(() => {
                          const people = getPeriodData(selectedPeriod, '중요_인물');
                          return people && Array.isArray(people) && people.length > 0 && (
                            <View style={styles.modalSection}>
                              <View style={styles.sectionTitleContainer}>
                                <Ionicons name="people" size={24} color="#40ABE5" />
                                <Text style={styles.sectionTitle}>Important Figures</Text>
                              </View>
                              <FlatList
                                data={people}
                                keyExtractor={(item, index) => `person_${index}`}
                                renderItem={({ item, index }) => (
                                  <View style={styles.personItem}>
                                    <Text style={styles.personName}>
                                      {getItemField(item, '이름') || `인물 ${index + 1}`}
                                    </Text>
                                    <Text style={styles.personDescription}>
                                      {getItemField(item, '설명') || "설명 정보가 없습니다."}
                                    </Text>
                                  </View>
                                )}
                                scrollEnabled={false}
                              />
                            </View>
                          );
                        })()}

                        {/* 문화적 특징 - 데이터 있는 경우만 표시 */}
                        {(() => {
                          const culture = getPeriodData(selectedPeriod, '문화적_특징');
                          return culture && (
                            <View style={styles.modalSection}>
                              <View style={styles.sectionTitleContainer}>
                                <Ionicons name="color-palette" size={24} color="#40ABE5" />
                                <Text style={styles.sectionTitle}>Cultural Features</Text>
                              </View>
                              <Text style={styles.sectionText}>
                                {culture || "문화적 특징에 대한 정보가 없습니다."}
                              </Text>
                            </View>
                          );
                        })()}
                      </>
                    ) : (
                      <View style={styles.noDataModalContainer}>
                        <Ionicons name="alert-circle" size={50} color="#d0e6f5" />
                        <Text style={styles.noDataModalText}>No detailed information available for the selected period.</Text>
                        <Text style={styles.noDataModalSubtext}>Please select another period or ask Trabuddy for information about this period.</Text>

                        {/* 추가 여백을 위한 뷰 */}
                        <View style={{ height: 100 }} />
                      </View>
                    )}
                  </ScrollView>
                </Animated.View>
              </View>
            </SafeAreaView>
          </Modal>
        </SafeAreaView>
      </Frame>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  spacer: {
    width: 40,
  },
  headerText: {
    fontFamily: "OriginalSurfer",
    fontSize: 28,
    textAlign: "center",
    color: FIGMA_COLORS.primaryText,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Outfit',
    fontSize: 16,
    color: '#40ABE5',
    marginTop: 10,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontFamily: 'Outfit',
    fontSize: 18,
    color: '#40ABE5',
    marginBottom: 10,
  },
  noDataSubText: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  dataContainer: {
    flex: 1,
  },
  histDataHeader: {
    padding: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 15,
    marginBottom: 15,
  },
  histDataTitle: {
    fontFamily: 'OriginalSurfer',
    fontSize: 22,
    color: FIGMA_COLORS.primaryText,
    marginBottom: 8,
  },
  histDataSubtitle: {
    fontFamily: 'Outfit',
    fontSize: 16,
    color: FIGMA_COLORS.primaryText,
    marginBottom: 5,
  },
  histDataTimestamp: {
    fontFamily: 'Outfit',
    fontSize: 12,
    color: FIGMA_COLORS.secondaryText,
  },
  periodsContainer: {
    flex: 1,
  },
  periodItem: {
    flexDirection: 'row',
    backgroundColor: FIGMA_COLORS.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#edf2f7',
  },
  periodIconContainer: {
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodIconBackground: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodIconText: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'OriginalSurfer',
    fontWeight: '600',
  },
  periodContentContainer: {
    flex: 1,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  periodTitle: {
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: '600',
    color: FIGMA_COLORS.primaryText,
  },
  periodDescription: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: FIGMA_COLORS.secondaryText,
    lineHeight: 20,
    marginBottom: 8,
  },
  periodTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  periodTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f3fc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 4,
  },
  periodTagText: {
    fontSize: 10,
    color: '#40ABE5',
    fontFamily: 'Outfit',
    fontWeight: '500',
    marginLeft: 3,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: FIGMA_COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
    paddingTop: 10,
    width: '100%',
    height: SCREEN_HEIGHT * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeaderBar: {
    width: 40, // 조금 더 작게
    height: 5, // 조금 더 얇게
    backgroundColor: '#ccc', // 색상 변경
    borderRadius: 100,
    alignSelf: 'center',
    marginBottom: 3,
  },
  modalDragHandle: {
    width: '100%',
    height: 30, // 작게 조정
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    paddingTop: 5,
  },
  modalDragHint: {
    fontSize: 9, // 더 작게
    color: '#aaa', // 연한 색상
    fontFamily: 'Outfit',
    marginTop: 2,
    opacity: 0.8, // 투명도 추가
  },
  modalHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15,
    marginBottom: 15,
    width: '100%',
  },
  modalTitle: {
    fontFamily: 'OriginalSurfer',
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    maxWidth: '90%',
    marginTop: 5,
    marginBottom: 5,
  },
  modalBody: {
    flex: 1,
    width: '100%',
  },
  modalScrollContent: {
    paddingBottom: 50,
    flexGrow: 1,
  },
  modalSection: {
    marginBottom: 20,
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e6f0f8',
    width: '100%',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontFamily: 'Outfit',
    fontSize: 20,
    fontWeight: '600',
    color: '#40ABE5',
    marginLeft: 10,
  },
  sectionText: {
    fontFamily: 'Outfit',
    fontSize: 16,
    color: FIGMA_COLORS.primaryText,
    lineHeight: 24,
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: FIGMA_COLORS.white,
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  eventNumberContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#40ABE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  eventNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontFamily: 'Outfit',
    fontSize: 17,
    fontWeight: '600',
    color: FIGMA_COLORS.primaryText,
    marginBottom: 5,
  },
  eventDescriptionContainer: {
    width: '100%',
    flexDirection: 'column',
  },
  eventDescription: {
    fontFamily: 'Outfit',
    fontSize: 15,
    color: FIGMA_COLORS.secondaryText,
    lineHeight: 22,
  },
  eventSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  personItem: {
    backgroundColor: FIGMA_COLORS.white,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#40ABE5',
  },
  personName: {
    fontFamily: 'Outfit',
    fontSize: 17,
    fontWeight: '600',
    color: FIGMA_COLORS.primaryText,
    marginBottom: 5,
  },
  personDescription: {
    fontFamily: 'Outfit',
    fontSize: 15,
    color: FIGMA_COLORS.secondaryText,
    lineHeight: 22,
  },
  headerImageContainer: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 15,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  navigationButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#e6f3fc',
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
  },
  navigationButtonText: {
    fontFamily: 'Outfit',
    fontSize: 14,
    fontWeight: '500',
    color: '#40ABE5',
    marginHorizontal: 5,
  },
  disabledButtonText: {
    color: '#ccc',
  },
  pageIndicator: {
    fontFamily: 'Outfit',
    fontSize: 14,
    fontWeight: '500',
    color: FIGMA_COLORS.primaryText,
    backgroundColor: '#fff',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryContainer: {
    marginVertical: 10,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderWidth: 1,
    borderColor: '#d0e6f5',
    borderRadius: 8,
    backgroundColor: '#eaf5fd',
  },
  summaryTitle: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '500',
    color: '#40ABE5',
  },
  summaryContent: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#d0e6f5',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#f9fdff',
  },
  noDataModalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    minHeight: 300,
  },
  noDataModalText: {
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: '500',
    color: '#40ABE5',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  noDataModalSubtext: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: FIGMA_COLORS.secondaryText,
    textAlign: 'center',
    marginBottom: 20,
  },
  descriptionContainer: {
    width: '100%',
    flexDirection: 'column',
  },
  eventDescriptionContainer: {
    width: '100%',
    flexDirection: 'column',
  },
  // TTS 버튼 스타일
  ttsButton: {
    padding: 6,
    borderRadius: 15,
    backgroundColor: "#E3F2FD",
    marginLeft: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#BBDEFB",
    alignSelf: "flex-end",
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});
