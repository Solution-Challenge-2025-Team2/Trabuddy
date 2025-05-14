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
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Frame from "../Frame";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get("window");
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
            새로운 역사/문화 정보가 있습니다
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
  white: "#FFFFFF",
};

export default function HistoryDetailScreen({ navigation, route }) {
  const [historicalData, setHistoricalData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

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
  const slideAnim = useRef(new Animated.Value(300)).current;

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
            <Text style={styles.headerText}>History & Culture</Text>
            <View style={styles.spacer} />
          </View>

          {isLoadingData ? (
            // 로딩 인디케이터
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#40ABE5" />
              <Text style={styles.loadingText}>역사/문화 데이터를 불러오는 중...</Text>
            </View>
          ) : !historicalData ? (
            // 데이터가 없는 경우
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>
                저장된 역사/문화 데이터가 없습니다.
              </Text>
              <Text style={styles.noDataSubText}>
                Trabuddy에게 역사/문화 정보를 요청해보세요!
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
                    <Text style={[styles.navigationButtonText, currentIndex === 0 && styles.disabledButtonText]}>이전</Text>
                  </TouchableOpacity>

                  <Text style={styles.pageIndicator}>
                    {currentIndex + 1} / {allHistoricalData.length}
                  </Text>

                  <TouchableOpacity
                    style={[styles.navigationButton, currentIndex === allHistoricalData.length - 1 && styles.disabledButton]}
                    onPress={goToNextList}
                    disabled={currentIndex === allHistoricalData.length - 1}
                  >
                    <Text style={[styles.navigationButtonText, currentIndex === allHistoricalData.length - 1 && styles.disabledButtonText]}>다음</Text>
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
                  역사/문화 정보
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
                    <Text style={styles.summaryTitle}>요약</Text>
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
                      {historicalData.summary || "역사/문화 정보가 없습니다."}
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
                    onPress={() => {
                      setSelectedPeriod(period);
                      setModalVisible(true);
                    }}
                  >
                    <View style={styles.periodHeader}>
                      <Text style={styles.periodTitle}>{period}</Text>
                      <Ionicons name="chevron-forward" size={20} color="#40ABE5" />
                    </View>
                    <Text style={styles.periodDescription} numberOfLines={2}>
                      {historicalData.message[period].시대_설명 || historicalData.message[period]['시대 설명'] || "이 시대에 대한 정보를 확인하려면 클릭하세요."}
                    </Text>
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
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>{selectedPeriod}</Text>
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setModalVisible(false)}
                      >
                        <Ionicons name="close" size={24} color="#000" />
                      </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                      {selectedPeriod && historicalData.message && historicalData.message[selectedPeriod] && (
                        <>
                          {/* 시대 설명 */}
                          <View style={styles.modalSection}>
                            <Text style={styles.sectionTitle}>시대 설명</Text>
                            <Text style={styles.sectionText}>
                              {historicalData.message[selectedPeriod].시대_설명 ||
                                historicalData.message[selectedPeriod]['시대 설명'] ||
                                "이 시대에 대한 설명이 없습니다."}
                            </Text>
                          </View>

                          {/* 주요 사건 */}
                          {(historicalData.message[selectedPeriod].주요_사건 ||
                            historicalData.message[selectedPeriod]['주요 사건']) && (
                              <View style={styles.modalSection}>
                                <Text style={styles.sectionTitle}>주요 사건</Text>
                                <FlatList
                                  data={historicalData.message[selectedPeriod].주요_사건 ||
                                    historicalData.message[selectedPeriod]['주요 사건']}
                                  keyExtractor={(item, index) => `event_${index}`}
                                  renderItem={({ item }) => (
                                    <View style={styles.eventItem}>
                                      <Text style={styles.eventTitle}>{item.이름 || item.name}</Text>
                                      <Text style={styles.eventDescription}>{item.설명 || item.description}</Text>
                                    </View>
                                  )}
                                  scrollEnabled={false}
                                />
                              </View>
                            )}
                        </>
                      )}
                    </ScrollView>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
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
    backgroundColor: FIGMA_COLORS.white,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    fontWeight: '500',
    color: FIGMA_COLORS.primaryText,
  },
  periodDescription: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: FIGMA_COLORS.secondaryText,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: FIGMA_COLORS.white,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 15,
    marginBottom: 15,
  },
  modalTitle: {
    fontFamily: 'OriginalSurfer',
    fontSize: 20,
    color: FIGMA_COLORS.primaryText,
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    flex: 1,
  },
  modalSection: {
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: '500',
    color: '#40ABE5',
    marginBottom: 10,
  },
  sectionText: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: FIGMA_COLORS.primaryText,
    lineHeight: 22,
  },
  eventItem: {
    backgroundColor: FIGMA_COLORS.white,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#40ABE5',
  },
  eventTitle: {
    fontFamily: 'Outfit',
    fontSize: 16,
    fontWeight: '500',
    color: FIGMA_COLORS.primaryText,
    marginBottom: 5,
  },
  eventDescription: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: FIGMA_COLORS.secondaryText,
    lineHeight: 20,
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
});
