import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
  Modal,
  ActivityIndicator,
} from "react-native";
import Frame from "../Frame";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Ionicons from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from "@react-navigation/native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Figma 색상 상수
const FIGMA_COLORS = {
  backgroundGradientStart: "#B2E4FF",
  backgroundGradientEnd: "#FFFFFF",
  logoText: "#000000",
  notificationIcon: "#353535",
  pageTitleText: "#000000",
  tabSelectedBg: "#00A4C5",
  tabDefaultBg: "#F1FFFF",
  tabSelectedIconBg: "#FFFFFF",
  tabDefaultIconBg: "#FFFFFF",
  tabSelectedText: "#FFFFFF",
  tabDefaultText: "#000000",
  cardBackground: "#FFFFFF",
  cardTitleText: "#000000",
  cardSubText: "rgba(0, 0, 0, 0.5)",
  categoryHeaderText: "#000000",
  iconAllColor: "#F2EE0F",
  iconPlaceColor: "#09954F",
  iconFoodColor: "#FFA048",
  iconActivityColor: "#E4BE00",
};

// Tab definitions with icons
const TABS = [
  {
    key: "All",
    label: "All",
    iconName: "star",
    iconColor: FIGMA_COLORS.iconAllColor,
  },
  {
    key: "Place",
    label: "Place",
    iconName: "map-marker",
    iconColor: FIGMA_COLORS.iconPlaceColor,
  },
  {
    key: "F&B",
    label: "F&B",
    iconName: "cutlery",
    iconColor: FIGMA_COLORS.iconFoodColor,
  },
  {
    key: "Activity",
    label: "Activity",
    iconName: "ticket",
    iconColor: FIGMA_COLORS.iconActivityColor,
  },
];

export default function PersonalContentScreen() {
  const route = useRoute();
  const [selectedTab, setSelectedTab] = useState("All");
  const [contentData, setContentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // 디버깅 함수 - 객체의 모든 레벨을 순회하며 필요한 데이터 찾기
  const findContentData = (obj, path = '') => {
    console.log(`[경로: ${path}] 객체 검사 중:`, typeof obj);

    // 객체가 아니면 검사 중단
    if (!obj || typeof obj !== 'object') return null;

    // 직접 place, f&b, activity 키를 가진 경우
    if ((obj.place && Array.isArray(obj.place)) ||
      (obj["f&b"] && Array.isArray(obj["f&b"])) ||
      (obj.activity && Array.isArray(obj.activity))) {
      console.log(`[경로: ${path}] 컨텐츠 데이터 발견!`);
      return obj;
    }

    // message 필드에 Place, F&B, Activity가 있는 경우
    if (obj.message && typeof obj.message === 'object') {
      console.log(`[경로: ${path}.message] 메시지 필드 검사 중`);

      const hasPlace = obj.message.Place && Array.isArray(obj.message.Place);
      const hasFnB = obj.message['F&B'] && Array.isArray(obj.message['F&B']);
      const hasActivity = obj.message.Activity && Array.isArray(obj.message.Activity);

      if (hasPlace || hasFnB || hasActivity) {
        console.log(`[경로: ${path}.message] 카테고리 데이터 발견: Place(${hasPlace}), F&B(${hasFnB}), Activity(${hasActivity})`);

        // 메시지 필드의 데이터를 표준 형식으로 변환
        return {
          place: hasPlace ? obj.message.Place.map(item => ({
            name: item.name,
            information: item.information,
            image: item.imageurl || item.imageUrl || item.image_url || item.image || item.img || item.url
          })) : [],
          "f&b": hasFnB ? obj.message['F&B'].map(item => ({
            name: item.name,
            information: item.information,
            image: item.imageurl || item.imageUrl || item.image_url || item.image || item.img || item.url
          })) : [],
          activity: hasActivity ? obj.message.Activity.map(item => ({
            name: item.name,
            information: item.information,
            image: item.imageurl || item.imageUrl || item.image_url || item.image || item.img || item.url
          })) : []
        };
      }
    }

    // contents 필드에 데이터가 있는 경우
    if (obj.contents) {
      console.log(`[경로: ${path}.contents] 컨텐츠 필드 검사 중`);
      if (typeof obj.contents === 'object') {
        return obj.contents;
      } else if (typeof obj.contents === 'string') {
        try {
          const parsed = JSON.parse(obj.contents);
          return parsed;
        } catch (e) {
          console.log(`[경로: ${path}.contents] 문자열 파싱 실패:`, e.message);
        }
      }
    }

    // data 필드에 데이터가 있는 경우
    if (obj.data && typeof obj.data === 'object') {
      console.log(`[경로: ${path}.data] data 필드 검사 중`);
      // data 필드에서 재귀적으로 검색
      const dataResult = findContentData(obj.data, `${path}.data`);
      if (dataResult) return dataResult;
    }

    // text 필드가 객체인 경우 (챗 메시지가 객체로 전달된 경우)
    if (obj.text && typeof obj.text === 'object') {
      console.log(`[경로: ${path}.text] text 필드 검사 중`);
      // text 필드에서 재귀적으로 검색
      const textResult = findContentData(obj.text, `${path}.text`);
      if (textResult) return textResult;
    }

    // 모든 키를 검사해서 중첩된 객체를 찾음
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object' && key !== 'data' && key !== 'message' && key !== 'contents' && key !== 'text') {
        console.log(`[경로: ${path}.${key}] 추가 필드 검사 중`);
        const nestedResult = findContentData(obj[key], `${path}.${key}`);
        if (nestedResult) return nestedResult;
      }
    }

    return null;
  };

  // Route 파라미터 또는 AsyncStorage에서 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let parsedData = null;
        let dataSource = '';

        // 1. route.params에서 데이터 확인 (자동 내비게이션이나 View more details 버튼에서 직접 전달한 데이터)
        if (route.params?.messageData) {
          // 자동 내비게이션인지 일반 버튼 클릭인지 로그로 구분
          if (route.params.isAutoNavigation) {
            console.log('자동 내비게이션으로 전달받은 메시지 데이터 발견');
          } else {
            console.log('View more details에서 전달받은 메시지 데이터 발견');
          }

          console.log('메시지 ID:', route.params.messageId);
          parsedData = route.params.messageData;
          dataSource = 'route.params.messageData';
        }
        // 2. route.params에서 responseData 확인 (이전 방식과의 호환성)
        else if (route.params?.responseData) {
          console.log('라우트 파라미터에서 responseData 발견');
          parsedData = route.params.responseData;
          dataSource = 'route.params.responseData';
        }
        // 3. active_message_id 확인 (View more details에서 저장한 ID)
        else {
          const activeMessageId = await AsyncStorage.getItem('active_message_id');
          console.log('활성 메시지 ID:', activeMessageId);

          if (activeMessageId) {
            // 활성 메시지 ID로 저장된 데이터 가져오기
            const messageData = await AsyncStorage.getItem(activeMessageId);
            if (messageData) {
              console.log('활성 메시지의 데이터 발견');
              parsedData = JSON.parse(messageData);
              dataSource = `AsyncStorage[${activeMessageId}]`;
            }
          }

          // 4. 위 방법으로 데이터를 찾지 못한 경우 기본 last_response_data 확인
          if (!parsedData) {
            const responseData = await AsyncStorage.getItem('last_response_data');
            if (responseData) {
              console.log('AsyncStorage에서 기본 response_data 발견');
              parsedData = JSON.parse(responseData);
              dataSource = 'AsyncStorage[last_response_data]';
            }
          }
        }

        console.log('데이터 소스:', dataSource);

        // 데이터가 없을 경우 null로 설정하고 종료
        if (!parsedData) {
          console.log('저장된 응답 데이터가 없습니다');
          setContentData(null);
          return;
        }

        // 로그에 전체 데이터 구조 출력 (디버깅용)
        console.log('가져온 데이터 키:', Object.keys(parsedData));
        try {
          console.log('가져온 데이터 유형:', typeof parsedData);
          if (typeof parsedData === 'object') {
            console.log('가져온 데이터 일부:', JSON.stringify(parsedData).substring(0, 200) + '...');
          }
        } catch (e) {
          console.log('데이터 직렬화 오류:', e.message);
        }

        // 새 함수를 사용하여 컨텐츠 데이터 찾기
        const contents = findContentData(parsedData);

        // 데이터 설정
        if (contents) {
          console.log('컨텐츠 데이터 발견, 설정 시작');
          setContentData(contents);
          console.log('컨텐츠 데이터 설정 완료');

          // 데이터 미리보기 로깅
          const place = contents.place || [];
          const fnb = contents["f&b"] || [];
          const activity = contents.activity || [];

          console.log(`데이터 항목 개수: place(${place.length}), f&b(${fnb.length}), activity(${activity.length})`);

          // 각 카테고리별 첫 항목 로깅 (있을 경우)
          if (place.length > 0) console.log('첫 장소 항목:', JSON.stringify(place[0]));
          if (fnb.length > 0) console.log('첫 F&B 항목:', JSON.stringify(fnb[0]));
          if (activity.length > 0) console.log('첫 활동 항목:', JSON.stringify(activity[0]));
        } else {
          console.log('컨텐츠 데이터를 찾을 수 없습니다');
          setContentData(null);
        }
      } catch (error) {
        console.error('데이터 가져오기 오류:', error);
        setContentData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [route.params]);

  // 카테고리별로 필터링된 데이터
  const filteredContent = useMemo(() => {
    if (!contentData) return [];

    if (selectedTab === "All") {
      return [
        ...(contentData.place || []),
        ...(contentData["f&b"] || []),
        ...(contentData.activity || [])
      ];
    } else if (selectedTab === "Place") {
      return contentData.place || [];
    } else if (selectedTab === "F&B") {
      return contentData["f&b"] || [];
    } else if (selectedTab === "Activity") {
      return contentData.activity || [];
    }

    return [];
  }, [selectedTab, contentData]);

  // 각 카테고리별 데이터 목록
  const categoryContents = useMemo(() => {
    if (!contentData) return [];

    return [
      { key: "Place", data: contentData.place || [] },
      { key: "F&B", data: contentData["f&b"] || [] },
      { key: "Activity", data: contentData.activity || [] }
    ].filter(category => category.data.length > 0);
  }, [contentData]);

  // 아이템 클릭 핸들러
  const handleItemPress = (item) => {
    console.log('선택된 아이템:', item);
    console.log('이미지 URL:', item.image);
    setSelectedItem(item);
    setModalVisible(true);
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
        <View style={styles.container}>
          <View style={styles.fixedSection}>
            <Text style={styles.pageTitle}>
              Places you'll love, chosen for you
            </Text>

            <FlatList
              data={TABS}
              horizontal
              keyExtractor={(item) => item.key}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsContainer}
              renderItem={({ item }) => {
                const isSelected = item.key === selectedTab;
                return (
                  <TouchableOpacity
                    style={[
                      styles.tabItem,
                      isSelected
                        ? styles.tabItemSelected
                        : styles.tabItemDefault,
                    ]}
                    onPress={() => setSelectedTab(item.key)}
                  >
                    <View
                      style={[
                        styles.tabIconContainer,
                        isSelected
                          ? styles.tabIconContainerSelected
                          : styles.tabIconContainerDefault,
                        !isSelected && {
                          borderWidth: 1,
                          borderColor: "#E7E7E7",
                        },
                      ]}
                    >
                      <FontAwesome
                        name={item.iconName}
                        size={24}
                        color={item.iconColor}
                      />
                    </View>
                    <Text
                      style={[
                        styles.tabText,
                        isSelected
                          ? styles.tabTextSelected
                          : styles.tabTextDefault,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          <View style={styles.scrollableSection}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={FIGMA_COLORS.tabSelectedBg} />
                <Text style={styles.loadingText}>Loading data...</Text>
              </View>
            ) : !contentData ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No data to display.</Text>
                <Text style={styles.noDataSubText}>
                  Click "View more details" button in chat to see data.
                </Text>
              </View>
            ) : selectedTab === "All" ? (
              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollViewContent}
              >
                {categoryContents.map((category) => {
                  if (category.data.length === 0) return null;
                  return (
                    <View key={category.key} style={styles.categorySectionAll}>
                      <Text style={styles.categoryHeaderAll}>
                        {category.key}
                      </Text>
                      <FlatList
                        data={category.data}
                        horizontal
                        keyExtractor={(item, index) => `${category.key}-${index}`}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.cardsContainerAll}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={[styles.cardVertical, { marginRight: 16 }]}
                            onPress={() => handleItemPress(item)}
                          >
                            <Image
                              source={{ uri: item.image || 'https://placehold.co/600x400/png' }}
                              style={styles.cardImageVertical}
                              resizeMode="cover"
                              onError={(e) => {
                                console.log('카드 이미지 로딩 오류:', e.nativeEvent.error, '- URL:', item.image);
                              }}
                              onLoad={() => console.log('카드 이미지 로드 성공:', item.image?.substring(0, 50) + '...')}
                            />
                            <View style={styles.cardTextContainerVertical}>
                              <Text
                                style={styles.cardTitleVertical}
                                numberOfLines={1}
                              >
                                {item.name}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        )}
                      />
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <FlatList
                data={filteredContent}
                keyExtractor={(item, index) => `${selectedTab}-${index}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.cardsContainerVertical,
                  styles.scrollViewContent,
                ]}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.cardVertical}
                    onPress={() => handleItemPress(item)}
                  >
                    <Image
                      source={{ uri: item.image || 'https://placehold.co/600x400/png' }}
                      style={styles.cardImageVertical}
                      resizeMode="cover"
                      onError={(e) => {
                        console.log('카드 이미지 로딩 오류:', e.nativeEvent.error, '- URL:', item.image);
                      }}
                      onLoad={() => console.log('카드 이미지 로드 성공:', item.image?.substring(0, 50) + '...')}
                    />
                    <View style={styles.cardTextContainerVertical}>
                      <Text style={styles.cardTitleVertical} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>

          {/* 상세 정보 모달 */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>

                {selectedItem && (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <Image
                      source={{ uri: selectedItem.image || 'https://placehold.co/600x400/png' }}
                      style={styles.modalImage}
                      resizeMode="cover"
                      onError={(e) => {
                        console.log('모달 이미지 로딩 오류:', e.nativeEvent.error, '- URL:', selectedItem.image);
                      }}
                      onLoad={() => console.log('모달 이미지 로드 성공:', selectedItem.image?.substring(0, 50) + '...')}
                    />
                    <Text style={styles.modalTitle}>{selectedItem.name}</Text>
                    <Text style={styles.modalDescription}>{selectedItem.information}</Text>
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>
        </View>
      </Frame>
    </LinearGradient>
  );
}

const CARD_WIDTH_VERTICAL = SCREEN_WIDTH * 0.9;
const CARD_IMAGE_HEIGHT_VERTICAL = CARD_WIDTH_VERTICAL * (198 / 353);
const CARD_TEXT_AREA_HEIGHT_VERTICAL = 90;
const CARD_TOTAL_HEIGHT_VERTICAL =
  CARD_IMAGE_HEIGHT_VERTICAL + CARD_TEXT_AREA_HEIGHT_VERTICAL;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedSection: {
    marginBottom: 12,
  },
  scrollableSection: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  pageTitle: {
    fontFamily: "Outfit",
    fontSize: 32,
    fontWeight: "400",
    color: FIGMA_COLORS.pageTitleText,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "flex-start",
    height: 120,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "flex-start",
    marginRight: 10,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 40,
    height: 110,
    width: 80,
  },
  tabItemSelected: {
    backgroundColor: FIGMA_COLORS.tabSelectedBg,
  },
  tabItemDefault: {
    backgroundColor: FIGMA_COLORS.tabDefaultBg,
  },
  tabIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    backgroundColor: FIGMA_COLORS.tabDefaultIconBg,
  },
  tabIconContainerSelected: {
    backgroundColor: FIGMA_COLORS.tabSelectedIconBg,
  },
  tabIconContainerDefault: {},
  tabIcon: {
    width: 24,
    height: 24,
  },
  tabText: {
    fontFamily: "Outfit",
    fontSize: 20,
    fontWeight: "400",
    textAlign: "center",
    marginTop: 4,
  },
  tabTextSelected: {
    color: FIGMA_COLORS.tabSelectedText,
  },
  tabTextDefault: {
    color: FIGMA_COLORS.tabDefaultText,
  },
  categorySectionAll: {
    marginBottom: 24,
  },
  categoryHeaderAll: {
    fontFamily: "Outfit",
    fontSize: 24,
    fontWeight: "400",
    color: FIGMA_COLORS.categoryHeaderText,
    marginBottom: 16,
    marginLeft: 20,
  },
  cardsContainerAll: {
    paddingRight: 20,
    paddingLeft: 5,
  },
  cardVertical: {
    width: CARD_WIDTH_VERTICAL,
    height: CARD_TOTAL_HEIGHT_VERTICAL,
    borderRadius: 30,
    backgroundColor: FIGMA_COLORS.cardBackground,
    marginBottom: 24,
    elevation: 5,
    shadowColor: FIGMA_COLORS.cardTitleText,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    overflow: "hidden",
  },
  cardImageVertical: {
    width: "100%",
    height: CARD_IMAGE_HEIGHT_VERTICAL,
  },
  cardTextContainerVertical: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitleVertical: {
    fontFamily: "Outfit",
    fontSize: 22,
    fontWeight: "400",
    color: FIGMA_COLORS.cardTitleText,
    textAlign: "center",
    marginBottom: 4,
  },
  cardsContainerVertical: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 20,
  },

  // 로딩 및 빈 데이터 컨테이너
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontFamily: "Outfit",
    fontSize: 16,
    color: FIGMA_COLORS.tabSelectedBg,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  noDataText: {
    fontFamily: "Outfit",
    fontSize: 20,
    fontWeight: "500",
    color: FIGMA_COLORS.cardTitleText,
    marginBottom: 10,
    textAlign: 'center',
  },
  noDataSubText: {
    fontFamily: "Outfit",
    fontSize: 16,
    color: FIGMA_COLORS.cardSubText,
    textAlign: 'center',
  },

  // 모달 스타일
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: FIGMA_COLORS.cardBackground,
    borderRadius: 30,
    padding: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    marginBottom: 15,
  },
  modalTitle: {
    fontFamily: "Outfit",
    fontSize: 24,
    fontWeight: "500",
    color: FIGMA_COLORS.cardTitleText,
    marginBottom: 10,
  },
  modalDescription: {
    fontFamily: "Outfit",
    fontSize: 16,
    color: FIGMA_COLORS.cardSubText,
    lineHeight: 24,
  }
});
