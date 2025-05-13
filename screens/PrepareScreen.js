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

            // 데이터 설정
            setEssentialsData(receivedData);

            // 데이터 저장
            await AsyncStorage.setItem('travel_essentials_data', JSON.stringify(receivedData));

            // 준비물 데이터 존재 상태 업데이트
            setSavedEssentialsExist(true);

            // 모달 표시 여부 결정 (자동으로 표시하지 않음)
            // View More Details 버튼으로 온 경우에만 모달 자동 표시
            if (route.params.autoShowModal) {
              setShowResultsModal(true);
            }
          }
        }
      } catch (error) {
        console.error('라우트 파라미터 처리 중 오류:', error);
      }
    };

    handleRouteParams();
  }, [route.params]);

  // 컴포넌트 마운트 시 전역 이벤트 리스너 설정 및 저장된 데이터 확인
  useEffect(() => {
    console.log('PrepareScreen 마운트됨');

    // 데이터 리스너 등록
    const setupPreparationDataListener = () => {
      console.log('준비물 데이터 리스너 설정');

      // 이벤트 디스패처 정의
      global.dispatchPreparationDataEvent = (data) => {
        console.log('준비물 데이터 이벤트 수신', data ? '(데이터 있음)' : '(데이터 없음)');

        if (data) {
          // 새 데이터로 UI 업데이트
          setEssentialsData(data);
          setSavedEssentialsExist(true);
        }
      };

      // 이미 저장된 데이터가 있으면 불러오기
      if (global.preparationData) {
        console.log('전역 캐시에서 준비물 데이터 발견');
        setEssentialsData(global.preparationData);
        setSavedEssentialsExist(true);
      }
    };

    // 설정 실행
    setupPreparationDataListener();

    // 저장된 최신 준비물 데이터 로드
    const loadLatestPreparationData = async () => {
      try {
        // 준비물 데이터 존재 여부 확인
        const exists = await AsyncStorage.getItem('preparation_data_exists');

        if (exists === 'true') {
          console.log('저장된 준비물 데이터 존재 확인');

          // 현재 표시된 데이터가 없을 때만 로드
          if (!essentialsData) {
            // 저장된 데이터 불러오기
            const savedData = await AsyncStorage.getItem('travel_essentials_data');

            if (savedData) {
              try {
                const parsedData = JSON.parse(savedData);
                console.log('저장된 준비물 데이터 로드 성공:',
                  parsedData.category,
                  parsedData.message ? '(메시지 있음)' : '(메시지 없음)');

                setEssentialsData(parsedData);
                setSavedEssentialsExist(true);
              } catch (error) {
                console.error('준비물 데이터 파싱 오류:', error);
              }
            }
          }
        }
      } catch (error) {
        console.error('준비물 데이터 로드 오류:', error);
      }
    };

    // 데이터 로드 실행
    loadLatestPreparationData();

    // 컴포넌트 언마운트 시 이벤트 리스너 정리
    return () => {
      console.log('PrepareScreen 언마운트, 리스너 제거');
      // 이벤트 디스패처 제거
      global.dispatchPreparationDataEvent = null;
    };
  }, []);

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

      // 응답 데이터 저장
      setEssentialsData(response);

      // 로컬 스토리지에 데이터 저장
      await AsyncStorage.setItem('travel_essentials_data', JSON.stringify(response));
      await AsyncStorage.setItem('travel_essentials_destination', destination);
      await AsyncStorage.setItem('travel_essentials_startDate', startDate);
      await AsyncStorage.setItem('travel_essentials_endDate', endDate);

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
      const savedData = await AsyncStorage.getItem('travel_essentials_data');
      const savedDestination = await AsyncStorage.getItem('travel_essentials_destination');
      const savedStartDate = await AsyncStorage.getItem('travel_essentials_startDate');
      const savedEndDate = await AsyncStorage.getItem('travel_essentials_endDate');

      if (savedData) {
        setEssentialsData(JSON.parse(savedData));
        setShowResultsModal(true);
        setSelectedCategory("All");

        console.log('저장된 준비물 데이터 불러옴:', savedDestination, savedStartDate, savedEndDate);
      } else {
        Alert.alert(
          "준비물 정보 없음",
          "저장된 여행 준비물 정보가 없습니다. 'Find Travel Essentials' 버튼으로 새로 생성해주세요."
        );
      }
    } catch (error) {
      console.error('저장된 준비물 데이터 불러오기 오류:', error);
      Alert.alert(
        "오류",
        "저장된 준비물 정보를 불러오는 중 문제가 발생했습니다."
      );
    }
  };

  // 컴포넌트 마운트 시 저장된 데이터 확인
  useEffect(() => {
    const checkSavedData = async () => {
      const savedData = await AsyncStorage.getItem('travel_essentials_data');
      if (savedData) {
        setSavedEssentialsExist(true);
      }
    };

    checkSavedData();
  }, []);

  // 카테고리별 필터링된 데이터 계산
  const getFilteredItems = useCallback(() => {
    if (!essentialsData || !essentialsData.message) return [];

    if (selectedCategory === "All") {
      // 모든 카테고리의 아이템을 하나의 배열로 합침
      const allItems = [];
      Object.keys(essentialsData.message).forEach(category => {
        if (Array.isArray(essentialsData.message[category])) {
          essentialsData.message[category].forEach(item => {
            allItems.push({
              ...item,
              category // 카테고리 정보 추가
            });
          });
        }
      });
      return allItems;
    } else {
      // 선택된 카테고리의 아이템만 반환
      const categoryItems = essentialsData.message[selectedCategory] || [];
      return categoryItems.map(item => ({
        ...item,
        category: selectedCategory
      }));
    }
  }, [essentialsData, selectedCategory]);

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

            {isLoadingEssentials ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={FIGMA_COLORS.accentBlue} />
                <Text style={styles.loadingText}>여행 준비물 목록을 가져오는 중...</Text>
              </View>
            ) : essentialsData ? (
              <ScrollView
                style={styles.essentialsScrollView}
                contentContainerStyle={styles.essentialsContent}
                showsVerticalScrollIndicator={false}
              >
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

// 커스텀 데이트 피커 컴포넌트
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
});

// 폰트 로딩을 위한 참고 코드 (App.js 또는 최상위 컴포넌트에서 설정 필요)
// import { useFonts, Outfit_400Regular, Outfit_500Medium } from '@expo-google-fonts/outfit';
// import { OriginalSurfer_400Regular } from '@expo-google-fonts/original-surfer';
