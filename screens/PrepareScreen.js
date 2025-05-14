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
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import Frame from "../Frame";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendChatMessage, sendGuestChatMessage } from "../services/chatService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.7;
const CARD_HEIGHT = CARD_WIDTH * 0.8;

// 준비물 데이터 알림 메시지 컴포넌트
const PreparationNotification = ({ onPress, onDismiss }) => {
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
            새로운 준비물 정보가 있습니다
          </Text>
          <Text style={{ color: '#e0f0ff', fontFamily: 'Outfit', fontSize: 14, marginTop: 4 }}>
            터치하여 자세히 보기
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
};

// 추천 여행지 데이터
const RECOMMENDED_PLACES = [
  {
    id: "1",
    title: "Uyuni Salt Desert",
    subInfo: "additional info",
    image: require("../assets/figma_images/image_15_143_73.png"),
  },
  {
    id: "2",
    title: "Gyeongbokgound",
    subInfo: "historical palace",
    image: require("../assets/figma_images/image_16_143_67.png"),
  },
  {
    id: "3",
    title: "Jeju Island",
    subInfo: "volcanic island",
    image: { uri: "https://placehold.co/280x210/jeju/island" },
  },
];

export default function PrepareScreen({ navigation, route }) {
  const [startDate, setStartDate] = useState("2025-05-01");
  const [endDate, setEndDate] = useState("2025-05-10");
  const [destination, setDestination] = useState("Jeju Island");
  const [modalVisible, setModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [tempDestination, setTempDestination] = useState("");
  const [selectedDates, setSelectedDates] = useState({});
  const [dateRange, setDateRange] = useState({
    startDate: "2025-05-01",
    endDate: "2025-05-10",
  });
  const [selectionMode, setSelectionMode] = useState("none"); // 'none', 'start', 'end'
  const slideAnim = useRef(new Animated.Value(300)).current;

  // 여행 준비물 관련 상태
  const [isLoadingEssentials, setIsLoadingEssentials] = useState(false);
  const [essentialsData, setEssentialsData] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 준비물 데이터 존재 여부 상태
  const [savedEssentialsExist, setSavedEssentialsExist] = useState(false);

  // 새 준비물 데이터 알림 표시 상태
  const [showNotification, setShowNotification] = useState(false);
  const [hasNewData, setHasNewData] = useState(false);
  const [lastDataTimestamp, setLastDataTimestamp] = useState(0);

  // 여러 준비물 목록을 관리하기 위한 상태 추가
  const [allEssentialsData, setAllEssentialsData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 스와이프 제스처를 위한 상태
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    Platform.OS === 'web' ? {} :
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          pan.setOffset({
            x: pan.x._value,
            y: pan.y._value
          });
        },
        onPanResponderMove: Animated.event(
          [
            null,
            { dx: pan.x, dy: pan.y }
          ],
          { useNativeDriver: false }
        ),
        onPanResponderRelease: (evt, gestureState) => {
          pan.flattenOffset();

          // 스와이프 거리가 충분히 긴 경우 (50 픽셀 이상)에만 처리
          if (Math.abs(gestureState.dx) > 50) {
            // 오른쪽으로 스와이프 (이전 준비물 목록으로)
            if (gestureState.dx > 50 && currentIndex > 0) {
              goToPrevList();
            }
            // 왼쪽으로 스와이프 (다음 준비물 목록으로)
            else if (gestureState.dx < -50 && currentIndex < allEssentialsData.length - 1) {
              goToNextList();
            }
          }

          // 제스처 상태 초기화
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false
          }).start();
        }
      })
  ).current;

  // 목록 전환 애니메이션 효과
  const [slideTransition] = useState(new Animated.Value(0));

  // 준비물 데이터가 변경될 때 애니메이션 효과 적용
  useEffect(() => {
    if (essentialsData) {
      Animated.sequence([
        Animated.timing(slideTransition, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(slideTransition, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [currentIndex, essentialsData]);

  // 준비물 데이터가 변경된 경우 알림 표시
  useEffect(() => {
    if (essentialsData && !showResultsModal) {
      // 알림 표시 여부 결정
      const checkForNewData = async () => {
        try {
          // 저장된 타임스탬프 가져오기
          const storedTimestamp = await AsyncStorage.getItem('preparation_data_timestamp');
          if (storedTimestamp) {
            const timestamp = parseInt(storedTimestamp, 10);

            // 새 데이터인지 확인
            if (timestamp > lastDataTimestamp) {
              console.log('새 준비물 데이터 감지:', timestamp, '>', lastDataTimestamp);
              setLastDataTimestamp(timestamp);
              setHasNewData(true);
              setShowNotification(true);
            }
          }
        } catch (error) {
          console.error('타임스탬프 확인 오류:', error);
        }
      };

      checkForNewData();
    }
  }, [essentialsData]);

  // 컴포넌트 마운트 시 저장된 모든 준비물 목록 불러오기
  useEffect(() => {
    console.log('PrepareScreen 마운트: 모든 준비물 목록 로드');
    loadAllEssentialsData();
  }, []);

  // 다음 준비물 목록으로 이동
  const goToNextList = () => {
    if (currentIndex < allEssentialsData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setEssentialsData(allEssentialsData[nextIndex]);
    }
  };

  // 이전 준비물 목록으로 이동
  const goToPrevList = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setEssentialsData(allEssentialsData[prevIndex]);
    }
  };

  // 모든 준비물 목록 데이터 로드
  const loadAllEssentialsData = async () => {
    try {
      // AsyncStorage에서 모든 키 가져오기
      const allKeys = await AsyncStorage.getAllKeys();

      // 준비물 관련 키만 필터링 (prep_data_ 로 시작하는 키)
      const prepKeys = allKeys.filter(key => key.startsWith('prep_data_'));

      if (prepKeys.length === 0) {
        console.log('저장된 준비물 데이터가 없습니다.');
        setAllEssentialsData([]);
        return [];
      }

      console.log(`${prepKeys.length}개의 준비물 데이터를 찾았습니다.`);

      // 타임스탬프로 정렬 (최신순)
      prepKeys.sort((a, b) => {
        const timeA = parseInt(a.replace('prep_data_', '').split('_')[0]);
        const timeB = parseInt(b.replace('prep_data_', '').split('_')[0]);
        return timeB - timeA; // 내림차순 정렬
      });

      // 모든 데이터 로드
      const loadedData = await Promise.all(
        prepKeys.map(async (key) => {
          try {
            const data = await AsyncStorage.getItem(key);
            if (data) {
              const parsedData = JSON.parse(data);
              // 식별 정보 추가
              return {
                ...parsedData,
                key,
                timestamp: parseInt(key.replace('prep_data_', '').split('_')[0]),
                timestampStr: new Date(parseInt(key.replace('prep_data_', '').split('_')[0])).toLocaleString()
              };
            }
          } catch (e) {
            console.error(`${key} 데이터 로드 실패:`, e);
          }
          return null;
        })
      );

      // null 값 제거
      const validData = loadedData.filter(item => item !== null);

      if (validData.length > 0) {
        console.log(`${validData.length}개의 준비물 목록을 성공적으로 로드했습니다.`);
        setAllEssentialsData(validData);

        // 최신 데이터를 현재 표시할 데이터로 설정
        setEssentialsData(validData[0]);
        setSavedEssentialsExist(true);

        // 로드된 데이터 반환
        return validData;
      }

      return [];
    } catch (error) {
      console.error('준비물 목록 로드 오류:', error);
      return [];
    }
  };

  // 특정 준비물 데이터 찾기 (일치하는 데이터를 보여주기 위함)
  const findAndShowEssentialsData = (dataToFind) => {
    if (!dataToFind || allEssentialsData.length === 0) return;

    // 일치하는 데이터 찾기 (JSON 문자열 비교)
    const index = allEssentialsData.findIndex(item =>
      JSON.stringify(item.message) === JSON.stringify(dataToFind.message)
    );

    if (index !== -1) {
      setCurrentIndex(index);
      setEssentialsData(allEssentialsData[index]);
    }
  };

  // 라우트 파라미터를 통해 전달된 데이터 처리
  useEffect(() => {
    const handleRouteParams = async () => {
      try {
        // 라우트 파라미터 확인
        if (route.params && route.params.messageData) {
          console.log('Prepare 화면으로 데이터가 전달되었습니다:', route.params.messageId);

          const receivedData = route.params.messageData;
          console.log('전달받은 데이터 카테고리:', receivedData.category);

          // preparation 카테고리인 경우 처리
          if (receivedData.category === 'preparation' && receivedData.message) {
            console.log('준비물 데이터 감지:', Object.keys(receivedData.message));

            // 모든 준비물 목록 로드
            const loadedData = await loadAllEssentialsData();
            let targetIndex = -1;

            // 전달받은 타임스탬프가 있는 경우 (View More Details에서 온 경우)
            if (route.params.timestamp) {
              const timestamp = route.params.timestamp;
              console.log('타임스탬프로 준비물 데이터 찾기:', timestamp);

              // 타임스탬프가 일치하는 데이터 찾기 - 정확히 일치하는 경우
              targetIndex = loadedData.findIndex(item => item.timestamp === timestamp);

              // 정확히 일치하는 데이터가 없는 경우 키 이름에서 타임스탬프 추출하여 비교
              if (targetIndex === -1) {
                targetIndex = loadedData.findIndex(item =>
                  item.key && item.key.includes(timestamp.toString())
                );
              }

              // 그래도 찾지 못한 경우 메시지 내용으로 비교
              if (targetIndex === -1) {
                console.log('타임스탬프로 찾지 못해 메시지 내용으로 비교합니다');
                targetIndex = loadedData.findIndex(item =>
                  JSON.stringify(item.message) === JSON.stringify(receivedData.message)
                );
              }
            } else {
              // 타임스탬프가 없는 경우 메시지 내용으로 비교
              targetIndex = loadedData.findIndex(item =>
                JSON.stringify(item.message) === JSON.stringify(receivedData.message)
              );
            }

            if (targetIndex !== -1) {
              // 일치하는 항목이 있으면 해당 인덱스로 설정
              console.log('일치하는 데이터를 찾았습니다:', targetIndex);
              setCurrentIndex(targetIndex);
              setEssentialsData(loadedData[targetIndex]);
            } else {
              console.log('일치하는 데이터를 찾지 못했습니다. 첫 번째 데이터 사용');
              // 일치하는 항목이 없으면 첫 번째 데이터 사용
              setCurrentIndex(0);
              if (loadedData.length > 0) {
                setEssentialsData(loadedData[0]);
              } else {
                // 데이터가 없는 경우 receivedData를 저장하고 표시
                const timestamp = Date.now();
                const prepKey = `prep_data_${timestamp}`;
                const enhancedData = {
                  ...receivedData,
                  key: prepKey,
                  timestamp,
                  timestampStr: new Date(timestamp).toLocaleString()
                };

                // 데이터 저장
                await AsyncStorage.setItem(prepKey, JSON.stringify(enhancedData));
                await AsyncStorage.setItem('travel_essentials_data', JSON.stringify(enhancedData));
                await AsyncStorage.setItem('preparation_data_exists', 'true');

                // 전체 데이터에 추가
                setAllEssentialsData([enhancedData]);
                setEssentialsData(enhancedData);
              }
            }

            // 준비물 데이터 존재 상태 업데이트
            setSavedEssentialsExist(true);

            // View More Details 버튼으로 온 경우에만 모달 자동 표시
            if (route.params.autoShowModal) {
              // 약간의 지연 시간을 두어 데이터 로드 후 모달 표시
              setTimeout(() => {
                setShowResultsModal(true);
              }, 100);
            }
          }
        }
      } catch (error) {
        console.error('라우트 파라미터 처리 중 오류:', error);
      }
    };

    handleRouteParams();
  }, [route.params]);

  // 모달이 닫힐 때 slideAnim 값 초기화
  useEffect(() => {
    if (!modalVisible) {
      slideAnim.setValue(300);
    }
  }, [modalVisible]);

  // 날짜 표시 형식 변환 함수
  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${year} - ${month} - ${day}`;
  };

  const openCountryModal = () => {
    setTempDestination(destination);
    setModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  };

  const closeModal = () => {
    // 애니메이션 없이 바로 모달 닫기
    setModalVisible(false);
  };

  const saveDestination = () => {
    if (tempDestination.trim() !== "") {
      setDestination(tempDestination);
    }
    closeModal();
  };

  const openCalendarModal = () => {
    // 모달 열 때 기존 선택된 날짜로 마커 초기화
    const initialMarkedDates = {};
    if (startDate && endDate) {
      // 시작일과 종료일이 같은 경우
      if (startDate === endDate) {
        initialMarkedDates[startDate] = {
          startingDay: true,
          endingDay: true,
          color: FIGMA_COLORS.accentBlue,
          textColor: "white",
        };
      }
      // 기간이 설정된 경우
      else {
        // 시작일 마킹
        initialMarkedDates[startDate] = {
          startingDay: true,
          color: FIGMA_COLORS.accentBlue,
          textColor: "white",
        };

        // 종료일 마킹
        initialMarkedDates[endDate] = {
          endingDay: true,
          color: FIGMA_COLORS.accentBlue,
          textColor: "white",
        };

        // 중간 날짜들 마킹
        let currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + 1);

        const endDateObj = new Date(endDate);
        while (currentDate < endDateObj) {
          const dateString = currentDate.toISOString().split("T")[0];
          initialMarkedDates[dateString] = {
            color: FIGMA_COLORS.accentBlue,
            textColor: "white",
          };
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    setSelectedDates(initialMarkedDates);
    setDateRange({
      startDate: startDate,
      endDate: endDate,
    });
    setSelectionMode("none");
    setCalendarModalVisible(true);
  };

  const resetDateSelection = () => {
    setSelectedDates({});
    setDateRange({
      startDate: null,
      endDate: null,
    });
    setSelectionMode("start"); // 다시 시작일 선택 모드로
  };

  // 날짜 선택 처리 함수 - useCallback으로 메모이제이션
  const handleDayPress = useCallback(
    (day) => {
      const selectedDay = day.dateString;

      // 선택 모드에 따라 다르게 처리
      if (selectionMode === "none" || selectionMode === "start") {
        // 시작일 선택 모드
        const newSelectedDates = {
          [selectedDay]: {
            startingDay: true,
            endingDay: true,
            color: FIGMA_COLORS.accentBlue,
            textColor: "white",
          },
        };

        setSelectedDates(newSelectedDates);
        setDateRange({
          startDate: selectedDay,
          endDate: null,
        });
        setSelectionMode("end"); // 다음은 종료일 선택
      } else if (selectionMode === "end") {
        // 종료일 선택 모드
        const startDay = dateRange.startDate;

        // 시작일보다 이전 날짜를 선택한 경우
        if (selectedDay < startDay) {
          // 시작일과 종료일을 바꿈
          const newStartDate = selectedDay;
          const newEndDate = startDay;

          const newSelectedDates = createDateRange(newStartDate, newEndDate);
          setSelectedDates(newSelectedDates);
          setDateRange({
            startDate: newStartDate,
            endDate: newEndDate,
          });
        } else if (selectedDay > startDay) {
          // 정상적으로 종료일 선택
          const newSelectedDates = createDateRange(startDay, selectedDay);
          setSelectedDates(newSelectedDates);
          setDateRange({
            startDate: startDay,
            endDate: selectedDay,
          });
        } else {
          // 시작일과 같은 날짜 선택 (하루 선택)
          setSelectedDates({
            [selectedDay]: {
              startingDay: true,
              endingDay: true,
              color: FIGMA_COLORS.accentBlue,
              textColor: "white",
            },
          });
          setDateRange({
            startDate: selectedDay,
            endDate: selectedDay,
          });
        }

        setSelectionMode("done"); // 선택 완료
      } else if (selectionMode === "done") {
        // 선택 완료 상태에서 다시 선택하면 처음부터 다시 시작
        setSelectedDates({});
        setDateRange({
          startDate: null,
          endDate: null,
        });
        setSelectionMode("start");

        // 바로 첫 선택을 적용 (재귀 호출 대신 직접 처리)
        setTimeout(() => {
          const newSelectedDates = {
            [selectedDay]: {
              startingDay: true,
              endingDay: true,
              color: FIGMA_COLORS.accentBlue,
              textColor: "white",
            },
          };
          setSelectedDates(newSelectedDates);
          setDateRange({
            startDate: selectedDay,
            endDate: null,
          });
          setSelectionMode("end");
        }, 0);
      }
    },
    [
      selectionMode,
      dateRange,
      setSelectedDates,
      setDateRange,
      setSelectionMode,
      FIGMA_COLORS.accentBlue,
    ]
  );

  // 날짜 범위에 대한 마커 생성 헬퍼 함수 - useCallback으로 메모이제이션
  const createDateRange = useCallback(
    (start, end) => {
      const markedDates = {};

      // 시작일 설정
      markedDates[start] = {
        startingDay: true,
        color: FIGMA_COLORS.accentBlue,
        textColor: "white",
      };

      // 종료일 설정
      markedDates[end] = {
        endingDay: true,
        color: FIGMA_COLORS.accentBlue,
        textColor: "white",
      };

      // 중간 날짜들 설정
      let currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + 1);

      const endDate = new Date(end);
      while (currentDate < endDate) {
        const dateString = currentDate.toISOString().split("T")[0];
        markedDates[dateString] = {
          color: FIGMA_COLORS.accentBlue,
          textColor: "white",
        };
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return markedDates;
    },
    [FIGMA_COLORS.accentBlue]
  );

  // 날짜 선택 확인
  const confirmDateSelection = () => {
    // 선택이 완료되지 않은 경우
    if (selectionMode === "end") {
      // 시작일만 선택한 경우, 시작일을 종료일로도 설정
      setDateRange((prev) => ({
        ...prev,
        endDate: prev.startDate,
      }));
    }

    // 시작일과 종료일이 모두 있는 경우에만 적용
    if (dateRange.startDate && (dateRange.endDate || selectionMode === "end")) {
      const finalEndDate = dateRange.endDate || dateRange.startDate;
      setStartDate(dateRange.startDate);
      setEndDate(finalEndDate);
      closeCalendarModal();
    }
  };

  // 모달 내 상태 메시지 표시 함수
  const getSelectionStatusMessage = () => {
    if (selectionMode === "start" || selectionMode === "none") {
      return "Select first date";
    } else if (selectionMode === "end") {
      return "Select second date";
    } else if (selectionMode === "done") {
      if (dateRange.startDate === dateRange.endDate) {
        return `Selected: ${formatDisplayDate(dateRange.startDate)}`;
      } else {
        return `From: ${formatDisplayDate(
          dateRange.startDate
        )} → To: ${formatDisplayDate(dateRange.endDate)}`;
      }
    }
    return "";
  };

  const closeCalendarModal = () => {
    setCalendarModalVisible(false);
    // 모달이 닫힐 때 selectionMode를 초기화
    setSelectionMode("none");
  };

  // 달력 빈 영역 클릭 방지를 위한 함수
  const handleCalendarAreaPress = (e) => {
    e.stopPropagation();
  };

  // 결과 모달 내 스와이프 가능한 콘텐츠 렌더링
  const renderSwipeableContent = () => {
    if (!essentialsData) return null;

    return (
      <Animated.View
        style={{
          flex: 1,
          opacity: slideTransition.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.7]
          }),
          transform: [
            {
              translateX: slideTransition.interpolate({
                inputRange: [0, 1],
                outputRange: [0, currentIndex > 0 ? 100 : -100]
              })
            }
          ]
        }}
        {...panResponder.panHandlers}
      >
        <ScrollView
          style={styles.essentialsScrollView}
          contentContainerStyle={styles.essentialsContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 타임스탬프 표시 */}
          <View style={styles.timestampContainer}>
            <Text style={styles.timestampText}>
              {essentialsData.timestampStr || new Date().toLocaleString()}
            </Text>
          </View>

          {/* 요약 정보 표시 */}
          {essentialsData.summary && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>{essentialsData.summary}</Text>
            </View>
          )}

          {/* 각 카테고리별 섹션 */}
          {essentialsData.message && Object.keys(essentialsData.message).map((category) => (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category}</Text>

              {Array.isArray(essentialsData.message[category]) && essentialsData.message[category].length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScrollView}
                  contentContainerStyle={styles.categoryScrollContent}
                >
                  {essentialsData.message[category].map((item, index) => (
                    <TouchableOpacity
                      key={`${category}-${index}`}
                      style={styles.itemCard}
                      onPress={() => openItemDetail(item)}
                    >
                      {item.imageurl ? (
                        <Image
                          source={{ uri: item.imageurl }}
                          style={styles.itemImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.placeholderImage}>
                          <Ionicons name="shirt-outline" size={40} color={FIGMA_COLORS.accentBlue} />
                        </View>
                      )}
                      <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.noItemsText}>해당 카테고리에 준비물이 없습니다.</Text>
              )}
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    );
  };

  // 여행 준비물 찾기 API 호출 함수
  const findTravelEssentials = async () => {
    try {
      // 로딩 상태 시작
      setIsLoadingEssentials(true);
      // 즉시 전체 화면 모달 표시
      setShowResultsModal(true);

      // 메시지 형식 지정
      const message = `${destination}로 ${formatDisplayDate(startDate)}부터 ${formatDisplayDate(endDate)}기간 동안 여행을 갈거야 준비물을 알려줘`;

      // 토큰 확인하여 로그인 여부 판단
      const token = await AsyncStorage.getItem('access_token');
      let response;

      if (token) {
        // 로그인한 사용자 API 호출
        console.log('로그인 사용자로 준비물 요청');
        response = await sendChatMessage(message);
      } else {
        // 비로그인 사용자 API 호출
        console.log('게스트 사용자로 준비물 요청');
        response = await sendGuestChatMessage(message);
      }

      console.log('준비물 API 응답:', response);

      // 타임스탬프 추가
      const timestamp = Date.now();
      const prepKey = `prep_data_${timestamp}`;

      // 응답 데이터에 정보 추가
      const enhancedResponse = {
        ...response,
        key: prepKey,
        timestamp,
        timestampStr: new Date(timestamp).toLocaleString(),
        destination,
        startDate,
        endDate
      };

      // 응답 데이터 저장
      setEssentialsData(enhancedResponse);

      // 새 데이터를 목록에 추가
      const newDataList = [enhancedResponse, ...allEssentialsData];
      setAllEssentialsData(newDataList);
      setCurrentIndex(0); // 새 데이터를 첫 번째로 보여줌

      // 로컬 스토리지에 데이터 저장
      await AsyncStorage.setItem(prepKey, JSON.stringify(enhancedResponse));
      await AsyncStorage.setItem('travel_essentials_data', JSON.stringify(enhancedResponse));
      await AsyncStorage.setItem('travel_essentials_destination', destination);
      await AsyncStorage.setItem('travel_essentials_startDate', startDate);
      await AsyncStorage.setItem('travel_essentials_endDate', endDate);
      await AsyncStorage.setItem('latest_preparation_data_key', prepKey);
      await AsyncStorage.setItem('preparation_data_exists', 'true');
      await AsyncStorage.setItem('preparation_data_timestamp', timestamp.toString());

      setSelectedCategory("All");
    } catch (error) {
      console.error('준비물 가져오기 오류:', error);
      Alert.alert(
        "오류",
        "준비물 정보를 가져오는 중 문제가 발생했습니다. 다시 시도해주세요."
      );
      // 오류 발생 시 모달 닫기
      setShowResultsModal(false);
    } finally {
      // 로딩 상태 종료
      setIsLoadingEssentials(false);
    }
  };

  // 저장된 여행 준비물 데이터 불러오기
  const loadSavedEssentials = async () => {
    try {
      // 모든 준비물 목록 로드
      const loadedData = await loadAllEssentialsData();

      // 로드 후에도 데이터가 없으면 알림
      if (loadedData.length === 0) {
        Alert.alert(
          "준비물 정보 없음",
          "저장된 여행 준비물 정보가 없습니다. 'Find Travel Essentials' 버튼으로 새로 생성해주세요."
        );
        return;
      }

      // 첫 번째 데이터 사용
      setCurrentIndex(0);
      setEssentialsData(loadedData[0]);

      // 데이터가 있으면 모달 표시
      setShowResultsModal(true);
      setSelectedCategory("All");
    } catch (error) {
      console.error('저장된 준비물 데이터 불러오기 오류:', error);
      Alert.alert(
        "오류",
        "저장된 준비물 정보를 불러오는 중 문제가 발생했습니다."
      );
    }
  };

  // 아이템 상세 정보 모달 열기
  const openItemDetail = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  // 아이템 상세 정보 모달 닫기
  const closeDetailModal = () => {
    setShowDetailModal(false);
  };

  // 준비물 모달 닫기
  const closeResultsModal = () => {
    setShowResultsModal(false);
    setSavedEssentialsExist(true); // 데이터가 생성되었으므로 상태 업데이트
  };

  return (
    <LinearGradient
      colors={[
        FIGMA_COLORS.backgroundGradientStart,
        FIGMA_COLORS.backgroundGradientEnd,
      ]}
      style={{ flex: 1 }}
      start={{ x: 0.5, y: 0.17 }}
      end={{ x: 0.5, y: 0.65 }}
    >
      <Frame>
        {/* 새 준비물 데이터 알림 */}
        {showNotification && hasNewData && (
          <PreparationNotification
            onPress={() => {
              setShowNotification(false);
              setShowResultsModal(true);
            }}
            onDismiss={() => setShowNotification(false)}
          />
        )}

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 인사말 및 검색 섹션 */}
          <View style={styles.headerSection}>
            <Text style={styles.greeting}>Hello, nickname!</Text>
            <Text style={styles.title}>Where would you{"\n"}like to go?</Text>
          </View>

          {/* 필터 섹션 */}
          <View style={styles.filterContainer}>
            {/* 국가/목적지 선택 부분 - 터치 가능하도록 변경 */}
            <TouchableOpacity
              style={styles.filterDestinationSection}
              onPress={openCountryModal}
              activeOpacity={0.7}
            >
              <View style={styles.filterDestinationHeader}>
                <View style={styles.filterLabel}>
                  <Ionicons
                    name="search-outline"
                    size={24}
                    color={FIGMA_COLORS.primaryText}
                  />
                  <Text style={styles.filterLabelText}>Country</Text>
                </View>
              </View>
              <View style={styles.filterDestinationContent}>
                <Text style={styles.destinationText}>{destination}</Text>
              </View>
            </TouchableOpacity>

            {/* 날짜 선택 부분 - 터치 가능하도록 변경 */}
            <TouchableOpacity
              style={styles.filterDateSection}
              onPress={openCalendarModal}
              activeOpacity={0.7}
            >
              <View style={styles.filterDateHeader}>
                <View style={styles.filterLabel}>
                  <Ionicons
                    name="calendar-outline"
                    size={24}
                    color={FIGMA_COLORS.primaryText}
                  />
                  <Text style={styles.filterLabelText}>Date</Text>
                </View>
              </View>
              <View style={styles.filterDateContent}>
                <Text style={styles.dateText}>
                  {formatDisplayDate(startDate)}
                </Text>
                <View style={styles.dateSeparator}></View>
                <Text style={styles.dateText}>
                  {formatDisplayDate(endDate)}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 여행 준비물 찾기 버튼 */}
          <View style={styles.findEssentialsButtonContainer}>
            <TouchableOpacity
              style={styles.findEssentialsButton}
              onPress={findTravelEssentials}
            >
              <Text style={styles.findEssentialsButtonText}>
                Find Travel Essentials
              </Text>
              <Ionicons
                name="arrow-forward"
                size={24}
                color={FIGMA_COLORS.cardBackground}
              />
            </TouchableOpacity>

            {savedEssentialsExist && (
              <TouchableOpacity
                style={styles.viewSavedEssentialsButton}
                onPress={loadSavedEssentials}
              >
                <Text style={styles.viewSavedEssentialsText}>
                  View Saved Essentials
                </Text>
                <Ionicons
                  name="eye-outline"
                  size={22}
                  color={FIGMA_COLORS.accentBlue}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* 추천 여행지 섹션 */}
          <View style={styles.recommendedSection}>
            <Text style={styles.sectionTitle}>Recommended</Text>

            <FlatList
              data={RECOMMENDED_PLACES}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.cardsContainer}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.card}>
                  <View style={styles.cardImageContainer}>
                    <Image
                      source={item.image}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.cardSubInfo} numberOfLines={1}>
                      {item.subInfo}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </ScrollView>
      </Frame>

      {/* 국가/목적지 입력 모달 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <Animated.View
                style={[
                  styles.modalContent,
                  {
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <Text style={styles.modalTitle}>Enter Destination</Text>
                <TextInput
                  style={styles.modalInput}
                  value={tempDestination}
                  onChangeText={setTempDestination}
                  placeholder="Enter country or city name"
                  placeholderTextColor="#888"
                  autoFocus={false}
                />
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalCancelButton]}
                    onPress={closeModal}
                  >
                    <Text
                      style={[styles.modalButtonText, styles.modalCancelText]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalSaveButton]}
                    onPress={saveDestination}
                  >
                    <Text style={styles.modalButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 달력 모달 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={calendarModalVisible}
        onRequestClose={closeCalendarModal}
      >
        <TouchableWithoutFeedback onPress={closeCalendarModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.calendarModalContent}>
                <Text style={styles.modalTitle}>Select Travel Dates</Text>

                <View style={styles.selectionStatusContainer}>
                  <Text style={styles.selectionStatusText}>
                    {getSelectionStatusMessage()}
                  </Text>
                </View>

                <View style={styles.customCalendarContainer}>
                  <CustomDatePicker
                    onDateSelect={handleDayPress}
                    markedDates={selectedDates}
                    selectionMode={selectionMode}
                  />
                </View>

                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalCancelButton]}
                    onPress={closeCalendarModal}
                  >
                    <Text
                      style={[styles.modalButtonText, styles.modalCancelText]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalSaveButton]}
                    onPress={confirmDateSelection}
                  >
                    <Text style={styles.modalButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 결과 모달 */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={showResultsModal}
        onRequestClose={closeResultsModal}
      >
        <LinearGradient
          colors={[FIGMA_COLORS.backgroundGradientStart, FIGMA_COLORS.backgroundGradientEnd]}
          style={{ flex: 1 }}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.8 }}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={closeResultsModal}
              >
                <Ionicons name="chevron-back" size={30} color="#000" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Travel Essentials</Text>
              <View style={styles.spacer} />
            </View>

            {/* 여러 목록 간 이동을 위한 네비게이션 */}
            {allEssentialsData.length > 1 && (
              <View style={styles.listNavigation}>
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    currentIndex === 0 && styles.navButtonDisabled
                  ]}
                  onPress={goToPrevList}
                  disabled={currentIndex === 0}
                >
                  <Ionicons
                    name="chevron-back-circle"
                    size={30}
                    color={currentIndex === 0 ? '#ccc' : FIGMA_COLORS.accentBlue}
                  />
                </TouchableOpacity>

                <View style={styles.navInfoContainer}>
                  <Text style={styles.navInfoText}>
                    {currentIndex + 1} / {allEssentialsData.length}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.navButton,
                    currentIndex === allEssentialsData.length - 1 && styles.navButtonDisabled
                  ]}
                  onPress={goToNextList}
                  disabled={currentIndex === allEssentialsData.length - 1}
                >
                  <Ionicons
                    name="chevron-forward-circle"
                    size={30}
                    color={currentIndex === allEssentialsData.length - 1 ? '#ccc' : FIGMA_COLORS.accentBlue}
                  />
                </TouchableOpacity>
              </View>
            )}

            {isLoadingEssentials ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={FIGMA_COLORS.accentBlue} />
                <Text style={styles.loadingText}>여행 준비물 목록을 가져오는 중...</Text>
              </View>
            ) : essentialsData ? (
              renderSwipeableContent()
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>준비물 데이터를 불러올 수 없습니다.</Text>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      </Modal>

      {/* 아이템 상세 모달 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDetailModal}
        onRequestClose={closeDetailModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.itemDetailContent}>
            {selectedItem && (
              <>
                {selectedItem.imageurl && (
                  <Image
                    source={{ uri: selectedItem.imageurl }}
                    style={styles.itemDetailImage}
                    resizeMode="cover"
                  />
                )}
                <Text style={styles.itemDetailTitle}>{selectedItem.name}</Text>
                <ScrollView style={styles.itemDetailScrollView}>
                  <Text style={styles.itemDetailCategory}>{selectedItem.category}</Text>
                  <Text style={styles.itemDetailDescription}>{selectedItem.information}</Text>
                </ScrollView>
              </>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeDetailModal}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// 커스텀 데이터 피커 컴포넌트
const CustomDatePicker = React.memo(
  ({ onDateSelect, markedDates, selectionMode }) => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());

    // 컴포넌트 내 내부 함수들을 useMemo와 useCallback으로 최적화

    // 달의 일수 구하기
    const getDaysInMonth = useCallback((year, month) => {
      return new Date(year, month + 1, 0).getDate();
    }, []);

    // 달의 첫 날의 요일 구하기 (0: 일요일)
    const getFirstDayOfMonth = useCallback((year, month) => {
      return new Date(year, month, 1).getDay();
    }, []);

    // 이전 달로 이동
    const goToPreviousMonth = useCallback(() => {
      setCurrentMonth((prev) => {
        if (prev === 0) {
          setCurrentYear((prevYear) => prevYear - 1);
          return 11;
        } else {
          return prev - 1;
        }
      });
    }, []);

    // 다음 달로 이동
    const goToNextMonth = useCallback(() => {
      setCurrentMonth((prev) => {
        if (prev === 11) {
          setCurrentYear((prevYear) => prevYear + 1);
          return 0;
        } else {
          return prev + 1;
        }
      });
    }, []);

    // 날짜 선택 처리
    const handleDateSelect = useCallback(
      (day) => {
        const dateString = `${currentYear}-${String(currentMonth + 1).padStart(
          2,
          "0"
        )}-${String(day).padStart(2, "0")}`;
        onDateSelect({ dateString });
      },
      [currentYear, currentMonth, onDateSelect]
    );

    // 날짜가 마킹되어 있는지 확인
    const isDateMarked = useCallback(
      (day) => {
        const dateString = `${currentYear}-${String(currentMonth + 1).padStart(
          2,
          "0"
        )}-${String(day).padStart(2, "0")}`;
        return dateString in markedDates;
      },
      [currentYear, currentMonth, markedDates]
    );

    // 날짜의 마킹 스타일 가져오기
    const getDateMarkStyle = useCallback(
      (day) => {
        const dateString = `${currentYear}-${String(currentMonth + 1).padStart(
          2,
          "0"
        )}-${String(day).padStart(2, "0")}`;
        if (dateString in markedDates) {
          const markData = markedDates[dateString];
          return {
            isStarting: markData.startingDay,
            isEnding: markData.endingDay,
            color: markData.color,
          };
        }
        return null;
      },
      [currentYear, currentMonth, markedDates]
    );

    // 달력 헤더 렌더링
    const renderHeader = useCallback(() => {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      return (
        <View key="header" style={styles.calendarHeader}>
          <TouchableOpacity onPress={goToPreviousMonth}>
            <Ionicons
              name="chevron-back"
              size={24}
              color={FIGMA_COLORS.accentBlue}
            />
          </TouchableOpacity>
          <Text style={styles.calendarMonthText}>
            {monthNames[currentMonth]} {currentYear}
          </Text>
          <TouchableOpacity onPress={goToNextMonth}>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={FIGMA_COLORS.accentBlue}
            />
          </TouchableOpacity>
        </View>
      );
    }, [currentYear, currentMonth, goToPreviousMonth, goToNextMonth]);

    // 요일 헤더 렌더링
    const renderWeekdayHeader = useCallback(() => {
      const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      return (
        <View key="weekdays" style={styles.calendarWeekdays}>
          {weekDays.map((day, index) => (
            <Text
              key={index}
              style={[
                styles.calendarWeekdayText,
                index === 0 ? { color: "#f00" } : null,
                index === 6 ? { color: "#00f" } : null,
              ]}
            >
              {day}
            </Text>
          ))}
        </View>
      );
    }, []);

    // 날짜 그리기
    const renderDays = useCallback(() => {
      const daysInMonth = getDaysInMonth(currentYear, currentMonth);
      const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

      let daySquares = [];

      // 빈 날짜 채우기 (월 시작 전)
      for (let i = 0; i < firstDayOfMonth; i++) {
        daySquares.push(
          <View key={`empty-${i}`} style={styles.calendarDayEmpty} />
        );
      }

      // 실제 날짜 채우기
      for (let day = 1; day <= daysInMonth; day++) {
        const markStyle = getDateMarkStyle(day);
        const isMarked = isDateMarked(day);

        daySquares.push(
          <TouchableOpacity
            key={`day-${day}`}
            style={[
              styles.calendarDay,
              isMarked && {
                backgroundColor: markStyle?.color || FIGMA_COLORS.accentBlue,
              },
              markStyle?.isStarting && {
                borderTopLeftRadius: 20,
                borderBottomLeftRadius: 20,
              },
              markStyle?.isEnding && {
                borderTopRightRadius: 20,
                borderBottomRightRadius: 20,
              },
            ]}
            onPress={() => handleDateSelect({ dateString: `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` })}
          >
            <Text
              style={[styles.calendarDayText, isMarked && { color: "white" }]}
            >
              {day}
            </Text>
          </TouchableOpacity>
        );
      }

      // 날짜 그리드에 추가
      const rows = [];
      let cells = [];

      daySquares.forEach((day, i) => {
        cells.push(day);

        if ((i + 1) % 7 === 0 || i === daySquares.length - 1) {
          // 마지막 행인 경우 나머지 셀 채우기
          if (i === daySquares.length - 1 && cells.length < 7) {
            const remaining = 7 - cells.length;
            for (let j = 0; j < remaining; j++) {
              cells.push(
                <View key={`empty-end-${j}`} style={styles.calendarDayEmpty} />
              );
            }
          }

          rows.push(
            <View key={`row-${Math.floor(i / 7)}`} style={styles.calendarRow}>
              {cells}
            </View>
          );
          cells = [];
        }
      });

      return (
        <View key="days-container" style={styles.calendarDaysContainer}>
          {rows}
        </View>
      );
    }, [
      currentYear,
      currentMonth,
      getDaysInMonth,
      getFirstDayOfMonth,
      getDateMarkStyle,
      isDateMarked,
      handleDateSelect,
    ]);

    // 전체 달력 렌더링
    const calendar = React.useMemo(() => {
      return (
        <View style={styles.calendar}>
          {renderHeader()}
          {renderWeekdayHeader()}
          {renderDays()}
        </View>
      );
    }, [renderHeader, renderWeekdayHeader, renderDays]);

    return calendar;
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  greeting: {
    fontFamily: "Outfit",
    fontSize: 20,
    fontWeight: "500",
    color: FIGMA_COLORS.accentBlue,
    marginBottom: 8,
  },
  title: {
    fontFamily: "Outfit",
    fontSize: 32,
    fontWeight: "400",
    color: FIGMA_COLORS.primaryText,
    lineHeight: 40,
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  filterDateSection: {
    backgroundColor: FIGMA_COLORS.cardBackground,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 16,
    overflow: "hidden",
  },
  filterDateHeader: {
    backgroundColor: FIGMA_COLORS.filterBackground,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 15,
  },
  filterDateContent: {
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateSeparator: {
    width: 1,
    height: "100%",
    backgroundColor: "#e0e0e0",
  },
  filterDestinationSection: {
    backgroundColor: FIGMA_COLORS.cardBackground,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: "hidden",
    marginBottom: 16,
  },
  filterDestinationHeader: {
    backgroundColor: FIGMA_COLORS.filterBackground,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 15,
  },
  filterDestinationContent: {
    padding: 15,
  },
  filterLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  filterLabelText: {
    fontFamily: "Outfit",
    fontSize: 32,
    fontWeight: "500",
    color: FIGMA_COLORS.cardBackground,
  },
  dateText: {
    fontFamily: "Outfit",
    fontSize: 18,
    fontWeight: "400",
    color: FIGMA_COLORS.primaryText,
    marginBottom: 5,
  },
  destinationText: {
    fontFamily: "Outfit",
    fontSize: 20,
    fontWeight: "400",
    color: FIGMA_COLORS.primaryText,
  },
  findEssentialsButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  findEssentialsButton: {
    backgroundColor: FIGMA_COLORS.accentBlue,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 15,
  },
  viewSavedEssentialsButton: {
    backgroundColor: 'rgba(240, 248, 255, 0.9)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: FIGMA_COLORS.accentBlue,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  viewSavedEssentialsText: {
    fontFamily: "Outfit",
    fontSize: 18,
    fontWeight: "500",
    color: FIGMA_COLORS.accentBlue,
  },
  findEssentialsButtonText: {
    fontFamily: "Outfit",
    fontSize: 20,
    fontWeight: "500",
    color: FIGMA_COLORS.cardBackground,
  },
  sectionTitle: {
    fontFamily: "Outfit",
    fontSize: 24,
    fontWeight: "400",
    color: FIGMA_COLORS.primaryText,
    marginBottom: 16,
  },
  cardsContainer: {
    paddingRight: 20,
    paddingBottom: 40, // 카드 컨테이너에도 하단 패딩 추가
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT + 80, // 이미지 + 텍스트 영역 높이
    backgroundColor: FIGMA_COLORS.cardBackground,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    marginRight: 16,
    overflow: "hidden",
  },
  cardImageContainer: {
    width: "100%",
    height: CARD_HEIGHT,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardTextContainer: {
    padding: 16,
    alignItems: "center",
  },
  cardTitle: {
    fontFamily: "Outfit",
    fontSize: 24,
    fontWeight: "400",
    color: FIGMA_COLORS.primaryText,
    textAlign: "center",
    marginBottom: 4,
  },
  cardSubInfo: {
    fontFamily: "Outfit",
    fontSize: 18,
    fontWeight: "400",
    color: FIGMA_COLORS.secondaryText,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: FIGMA_COLORS.cardBackground,
    borderRadius: 30,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: "Outfit",
    fontSize: 24,
    fontWeight: "500",
    color: FIGMA_COLORS.primaryText,
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    fontFamily: "Outfit",
    fontSize: 18,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 15,
    padding: 12,
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    borderRadius: 20,
    padding: 12,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalCancelButton: {
    backgroundColor: "#f0f0f0",
  },
  modalSaveButton: {
    backgroundColor: FIGMA_COLORS.accentBlue,
  },
  modalButtonText: {
    fontFamily: "Outfit",
    fontSize: 16,
    fontWeight: "500",
    color: FIGMA_COLORS.cardBackground,
  },
  modalCancelText: {
    color: FIGMA_COLORS.primaryText,
  },
  calendarModalContent: {
    width: "90%",
    backgroundColor: FIGMA_COLORS.cardBackground,
    borderRadius: 30,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: "80%",
  },
  selectionStatusContainer: {
    marginVertical: 15,
    padding: 10,
    backgroundColor: "#f0f8ff",
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: FIGMA_COLORS.accentBlue,
  },
  selectionStatusText: {
    fontFamily: "Outfit",
    fontSize: 18,
    color: FIGMA_COLORS.accentBlue,
    textAlign: "center",
  },
  customCalendarContainer: {
    marginVertical: 10,
  },
  calendar: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    padding: 10,
  },
  calendarMonthText: {
    fontFamily: "Outfit",
    fontSize: 18,
    color: FIGMA_COLORS.primaryText,
  },
  calendarWeekdays: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingBottom: 5,
  },
  calendarWeekdayText: {
    fontFamily: "Outfit",
    fontSize: 14,
    color: FIGMA_COLORS.primaryText,
    width: 36,
    textAlign: "center",
  },
  calendarDaysContainer: {
    flexDirection: "column",
  },
  calendarRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  calendarDay: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  calendarDayText: {
    fontFamily: "Outfit",
    fontSize: 16,
    color: FIGMA_COLORS.primaryText,
  },
  calendarDayEmpty: {
    width: 36,
    height: 36,
  },
  modalContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  spacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontFamily: "Outfit",
    fontSize: 18,
    color: FIGMA_COLORS.primaryText,
    marginTop: 20,
    textAlign: 'center',
  },
  essentialsScrollView: {
    flex: 1,
  },
  essentialsContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryContainer: {
    backgroundColor: 'rgba(240, 248, 255, 0.8)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#d0e6ff',
  },
  summaryText: {
    fontFamily: "Outfit",
    fontSize: 16,
    color: FIGMA_COLORS.primaryText,
    lineHeight: 24,
  },
  categorySection: {
    marginBottom: 35,
  },
  categoryTitle: {
    fontFamily: "Outfit",
    fontSize: 22,
    fontWeight: "600",
    color: FIGMA_COLORS.accentBlue,
    marginBottom: 15,
    paddingLeft: 5,
  },
  categoryScrollView: {
    marginBottom: 10,
  },
  categoryScrollContent: {
    paddingRight: 20,
    paddingBottom: 15,
  },
  itemCard: {
    width: 140,
    marginRight: 15,
    marginBottom: 10,
    borderRadius: 15,
    backgroundColor: FIGMA_COLORS.cardBackground,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  itemImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  placeholderImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  itemName: {
    fontFamily: "Outfit",
    fontSize: 16,
    fontWeight: "500",
    color: FIGMA_COLORS.primaryText,
    padding: 12,
    paddingVertical: 16,
    textAlign: 'center',
    minHeight: 70,
  },
  noItemsText: {
    fontFamily: "Outfit",
    fontSize: 14,
    color: FIGMA_COLORS.secondaryText,
    fontStyle: 'italic',
    padding: 10,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontFamily: "Outfit",
    fontSize: 18,
    color: FIGMA_COLORS.secondaryText,
    textAlign: 'center',
  },
  itemDetailContent: {
    width: "90%",
    backgroundColor: FIGMA_COLORS.cardBackground,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: "80%",
    overflow: "hidden",
  },
  itemDetailImage: {
    width: "100%",
    height: 200,
  },
  itemDetailScrollView: {
    padding: 20,
    maxHeight: 300,
  },
  itemDetailTitle: {
    fontFamily: "Outfit",
    fontSize: 24,
    fontWeight: "600",
    color: FIGMA_COLORS.primaryText,
    marginBottom: 8,
    marginTop: 15,
    paddingHorizontal: 20,
  },
  itemDetailCategory: {
    fontFamily: "Outfit",
    fontSize: 16,
    fontWeight: "500",
    color: FIGMA_COLORS.accentBlue,
    marginBottom: 15,
    textTransform: "uppercase",
  },
  itemDetailDescription: {
    fontFamily: "Outfit",
    fontSize: 16,
    lineHeight: 24,
    color: FIGMA_COLORS.primaryText,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  listNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  navButton: {
    padding: 8,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navInfoContainer: {
    alignItems: 'center',
  },
  navInfoText: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '600',
    color: FIGMA_COLORS.accentBlue,
  },
  timestampContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  timestampText: {
    fontFamily: 'Outfit',
    fontSize: 12,
    color: FIGMA_COLORS.secondaryText,
  },
});

// 폰트 로딩을 위한 참고 코드 (App.js 또는 최상위 컴포넌트에서 설정 필요)
// import { useFonts, Outfit_400Regular, Outfit_500Medium } from '@expo-google-fonts/outfit';
// import { OriginalSurfer_400Regular } from '@expo-google-fonts/original-surfer';
