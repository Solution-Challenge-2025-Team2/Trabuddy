import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  Linking,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Frame from "../Frame";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { problemDescriptions } from "../data/ProblemDescriptions";
import * as Speech from "expo-speech";
import sos from "../data/SosNum.json";
import { CountryPicker } from "react-native-country-codes-picker";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.95;
const defaultSosNum = { police: [], fire: [], ambulance: [] }; // 기본 SOS 번호

// 국가 코드에 따라 긴급 전화번호를 정렬 함수
function EmergencyNumbersRow({ numbers, onPressNumber }) {
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}
    >
      {numbers.map((num, idx) => (
        <React.Fragment key={idx}>
          <TouchableOpacity
            onPress={() => onPressNumber(num)}
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <Text style={styles.cardDescription}>{num}</Text>
            <MaterialIcons name="phone" size={16} color="#40ABE5" />
          </TouchableOpacity>
          {idx < numbers.length - 1 && (
            <Text style={styles.cardDescription}>,&nbsp;</Text>
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

export default function EmergencyScreen() {
  const [countryCode, setCountryCode] = useState("KR"); // 국가 코드 상태를 한국(KR)으로 변경
  const [problems, setProblems] = useState([]);
  const [speaking, setSpeaking] = useState("");
  const [show, setShow] = useState(false);
  const [selectedCountryName, setSelectedCountryName] = useState("Korea, Republic of"); // 한국으로 초기값 설정
  const [selectedFlag, setSelectedFlag] = useState("🇰🇷"); // 한국 국기로 초기값 설정
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [pickerHeight, setPickerHeight] = useState(500);

  const countryRef = useRef(null); // 국가 선택을 위한 ref

  // 컴포넌트 마운트 시 초기 데이터 설정
  useEffect(() => {
    updateProblemsData(countryCode);
  }, [countryCode]);

  // 폰트 사전 로드를 위한 useEffect 추가
  useEffect(() => {
    // 폰트 스타일 적용을 위한 초기화 (필요시)
    if (Platform && Platform.OS === 'ios') {
      // iOS에서 폰트 관련 추가 처리가 필요한 경우
    }
  }, []);

  // 키보드 감지 이벤트 리스너 설정
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        // 디바이스 높이에 따라 적절한 높이 계산
        const screenHeight = Dimensions.get('window').height;
        setPickerHeight(screenHeight * 0.4); // 화면 높이의 40%로 설정
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setPickerHeight(500); // 원래 높이로 복원
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // 문제 데이터 업데이트 함수
  const updateProblemsData = (code) => {
    // 선택한 국가의 SOS 번호 가져오기 (없으면 기본값 사용)
    const countrySOSNumbers = sos[code] || defaultSosNum;

    const updatedData = [
      {
        id: "1",
        title: "Lost Items",
        description: problemDescriptions.lost,
        icon: require("../assets/figma_images/problem_icon_lost.png"),
        expanded: false,
      },
      {
        id: "2",
        title: "Emergency",
        description: {
          id: "emergency",
          title: "🚨 Emergency Numbers",
          numbers: [
            "👮 police: ",
            countrySOSNumbers.police || [],
            "🚒 fire: ",
            countrySOSNumbers.fire || [],
            "🚑 ambulance: ",
            countrySOSNumbers.ambulance || [],
          ],
        },
        icon: require("../assets/figma_images/problem_icon_emergency.png"),
        expanded: false,
      },
      {
        id: "3",
        title: "natural disaster",
        description: problemDescriptions.naturalDisaster,
        icon: require("../assets/figma_images/problem_icon_naturalDisaster.png"),
        expanded: false,
      },
      {
        id: "4",
        title: "Drug",
        description: problemDescriptions.drug,
        icon: require("../assets/figma_images/problem_icon_drug.png"),
        expanded: false,
      },
    ];

    setProblems(updatedData);
  };

  // 전화 걸기 함수
  const callNumber = (num) => {
    const url = `tel:${num}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          console.warn("Cannot open dialer for", num);
        }
      })
      .catch((err) => console.error("An error occurred", err));
  };

  const toggleExpand = (id) => {
    setProblems(
      problems.map((problem) =>
        problem.id === id
          ? { ...problem, expanded: !problem.expanded }
          : problem
      )
    );
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

  // 피그마에서 가져온 색상
  const FIGMA_COLORS = {
    backgroundGradientStart: "#B2E4FF",
    backgroundGradientEnd: "#FFFFFF",
    primaryText: "#000000",
    secondaryText: "rgba(0, 0, 0, 0.5)",
    cardBackground: "#FFFFFF",
    cardHeaderGradientStart: "#40ABE5",
    cardHeaderGradientEnd: "#528099",
    iconBackground: "#6DC0ED",
    white: "#FFFFFF",
  };

  // CountryPicker 관련 스타일
  const countryPickerStyles = {
    modal: {
      height: pickerHeight,
      position: 'relative',
    },
    textInput: {
      padding: 10,
      fontSize: 16,
      color: "#333",
      fontFamily: "Outfit",
    },
    countryName: {
      fontSize: 16,
      fontFamily: "Outfit",
      color: "#000",
    },
    flag: {
      fontSize: 24,
    },
    dialCode: {
      fontFamily: "Outfit",
    },
    inputView: {
      borderRadius: 10,
      backgroundColor: "#F5F5F5",
      marginBottom: 10,
      marginTop: 5,
      // 키보드가 나타났을 때 검색창을 위로 고정
      position: keyboardVisible ? 'absolute' : 'relative',
      top: keyboardVisible ? 0 : undefined,
      left: 0,
      right: 0,
      zIndex: 1000,
    },
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
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <View style={styles.headerContainer}>
              <Text style={styles.headerText}>
                What Problems{"\n"}are you facing?
              </Text>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={false}
            >
              {/* 국가 선택 버튼 추가 */}
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <TouchableOpacity
                  onPress={() => setShow(true)}
                  style={styles.countrySelectButton}
                >
                  <View style={styles.countryButtonContent}>
                    <Text style={styles.countryFlag}>{selectedFlag}</Text>
                    <Text style={styles.countryName}>{selectedCountryName}</Text>
                  </View>
                </TouchableOpacity>

                <CountryPicker
                  show={show}
                  pickerButtonOnPress={(item) => {
                    setCountryCode(item.code);
                    setSelectedCountryName(item.name.en);
                    setSelectedFlag(item.flag);
                    setShow(false);
                  }}
                  onBackdropPress={() => setShow(false)}
                  onRequestClose={() => setShow(false)}
                  style={countryPickerStyles}
                  lang="en"
                  inputPlaceholder="Search Country"
                  inputPlaceholderTextColor="#666"
                  searchInputProps={{
                    placeholderTextColor: "#666",
                    style: {
                      fontFamily: "Outfit",
                      fontSize: 16,
                      paddingHorizontal: 15,
                      paddingVertical: 10,
                      borderRadius: 10,
                      height: 50
                    },
                  }}
                  flatListProps={{
                    contentContainerStyle: {
                      paddingHorizontal: 10,
                      paddingTop: keyboardVisible ? 60 : 10, // 키보드가 나타났을 때 추가 패딩
                    },
                    keyboardShouldPersistTaps: 'handled' // 키보드가 목록을 탭할 때 유지
                  }}
                  showCloseButton={true}
                  enableModalAvoiding={true}
                  countryPickerProps={{
                    ItemSeparatorComponent: () => (
                      <View style={{ height: 1, backgroundColor: '#eee' }} />
                    )
                  }}
                  closeButtonStyle={{
                    fontFamily: "Outfit",
                    fontSize: 16,
                    textAlign: 'center',
                  }}
                  closeButtonImage={
                    <Text style={{ fontFamily: "Outfit", fontSize: 16 }}>Close</Text>
                  }
                  theme={{
                    fontFamily: "Outfit",
                    primaryColor: "#40ABE5",
                    primaryColorVariant: "#528099",
                    backgroundColor: "#FFFFFF",
                    onBackgroundTextColor: "#000000",
                    fontSize: 16,
                    space: 10,
                  }}
                />
              </View>
              {problems.map((problem) => (
                <View key={problem.id} style={styles.cardWrapper}>
                  {/* 외부 카드 (헤더 영역) */}
                  <LinearGradient
                    colors={[
                      FIGMA_COLORS.cardHeaderGradientStart,
                      FIGMA_COLORS.cardHeaderGradientEnd,
                    ]}
                    style={styles.outerCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {/* 키워드 영역 */}
                    <View style={styles.headerSection}>
                      <Text style={styles.cardHeaderTitle}>{problem.title}</Text>
                    </View>
                    <View style={styles.innerCard}>
                      {/* 내부 카드 (아이콘 및 해결책) */}
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => toggleExpand(problem.id)}
                      >
                        {/* 아이콘 영역 */}
                        <View style={styles.iconSection}>
                          <Image source={problem.icon} style={styles.cardIcon} />
                          {/* 화살표 아이콘 */}
                          <View style={styles.expandIconContainer}>
                            {problem.expanded ? (
                              <AntDesign
                                name="caretup"
                                size={18}
                                color="#40ABE5"
                                style={styles.expandIcon}
                              />
                            ) : (
                              <AntDesign
                                name="caretdown"
                                size={18}
                                color="#40ABE5"
                                style={styles.expandIcon}
                              />
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>

                      {/* 해결책 영역 (확장됐을 때만 표시) */}
                      {problem.expanded && (
                        <View style={styles.solutionSection}>
                          {problem.id === "2" ? (
                            // Emergency 카드 전용 렌더링 (speak 제거)
                            <View>
                              {/* 카드 제목 */}
                              <Text style={styles.cardSubtitle}>
                                {problem.description.title}
                              </Text>

                              {/* police 번호 */}
                              <Text style={styles.cardDescription}>
                                👮 police:
                              </Text>
                              <EmergencyNumbersRow
                                numbers={problem.description.numbers[1]}
                                onPressNumber={callNumber}
                              />

                              {/* fire 번호 */}
                              <Text style={styles.cardDescription}>🚒 fire:</Text>
                              <EmergencyNumbersRow
                                numbers={problem.description.numbers[3]}
                                onPressNumber={callNumber}
                              />

                              {/* ambulance 번호 */}
                              <Text style={styles.cardDescription}>
                                🚑 ambulance:
                              </Text>
                              <EmergencyNumbersRow
                                numbers={problem.description.numbers[5]}
                                onPressNumber={callNumber}
                              />
                            </View>
                          ) : problem.id === "1" || problem.id === "4" ? (
                            // Lost Items (1) / Drug (4) 기존 로직
                            problem.description.map((item) => (
                              <View key={item.id} style={styles.problemGroup}>
                                <Text style={styles.cardSubtitle}>
                                  {item.title}
                                </Text>
                                {item.steps.map((step, i) => (
                                  <View
                                    key={`step-${i}`}
                                    style={styles.descriptionColumn}
                                  >
                                    <Text style={styles.cardDescription}>
                                      {step}
                                    </Text>
                                    <TouchableOpacity onPress={() => speak(step)}>
                                      <MaterialIcons
                                        name="volume-up"
                                        size={20}
                                        color="#40ABE5"
                                      />
                                    </TouchableOpacity>
                                  </View>
                                ))}
                                {item.tips.map((tip, i) => (
                                  <View
                                    key={`tip-${i}`}
                                    style={styles.descriptionColumn}
                                  >
                                    <Text style={styles.cardDescription}>
                                      {tip}
                                    </Text>
                                    <TouchableOpacity onPress={() => speak(tip)}>
                                      <MaterialIcons
                                        name="volume-up"
                                        size={20}
                                        color="#40ABE5"
                                      />
                                    </TouchableOpacity>
                                  </View>
                                ))}
                              </View>
                            ))
                          ) : (
                            // Natural Disaster (3) 등 나머지
                            problem.description.map((item) => (
                              <View key={item.id} style={styles.problemGroup}>
                                {item.id === "title" ? (
                                  <Text style={styles.cardTitle}>
                                    {item.title}
                                  </Text>
                                ) : (
                                  <Text style={styles.cardSubtitle}>
                                    {item.title}
                                  </Text>
                                )}
                                {item.info.map((info, i) => (
                                  <View
                                    key={`info-${i}`}
                                    style={styles.descriptionColumn}
                                  >
                                    <Text style={styles.cardDescription}>
                                      {info}
                                    </Text>
                                    <TouchableOpacity onPress={() => speak(info)}>
                                      <MaterialIcons
                                        name="volume-up"
                                        size={20}
                                        color="#40ABE5"
                                      />
                                    </TouchableOpacity>
                                  </View>
                                ))}
                                {item.steps.map((step, i) => (
                                  <View
                                    key={`step-${i}`}
                                    style={styles.descriptionColumn}
                                  >
                                    <Text style={styles.cardDescription}>
                                      {step}
                                    </Text>
                                    <TouchableOpacity onPress={() => speak(step)}>
                                      <MaterialIcons
                                        name="volume-up"
                                        size={20}
                                        color="#40ABE5"
                                      />
                                    </TouchableOpacity>
                                  </View>
                                ))}
                              </View>
                            ))
                          )}
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </View>
              ))}
            </ScrollView>
          </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
  },
  headerContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  headerText: {
    fontFamily: "Outfit",
    fontSize: 32,
    textAlign: "center",
    color: "#000000",
    lineHeight: 40,
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollViewContent: {
    paddingBottom: 30,
    alignItems: "center",
  },
  cardWrapper: {
    width: "100%",
    marginBottom: 16,
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  outerCard: {
    borderRadius: 25,
    overflow: "hidden",
  },
  headerSection: {
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  innerCard: {
    backgroundColor: "#FFFFFF",
    margin: 15,
    marginTop: 0,
    borderRadius: 20,
    overflow: "hidden",
  },
  iconSection: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    position: "relative",
  },
  expandIconContainer: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  expandIcon: {},
  cardHeaderTitle: {
    fontFamily: "OriginalSurfer",
    fontSize: 26,
    color: "#FFFFFF",
  },
  cardIcon: {
    width: 90,
    height: 90,
    resizeMode: "contain",
  },
  solutionSection: {
    padding: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  cardDescription: {
    fontFamily: "Outfit",
    fontSize: 16,
    color: "#000000",
    lineHeight: 24,
  },
  cardTitle: {
    fontFamily: "Outfit",
    fontSize: 22,
    color: "#000000",
    marginBottom: 10,
  },
  cardSubtitle: {
    fontFamily: "Outfit",
    fontSize: 20,
    color: "#000000",
    marginBottom: 10,
  },
  descriptionColumn: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6,
    marginBottom: 8,
  },
  descriptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  countrySelectButton: {
    width: CARD_WIDTH * 0.83,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#F5F7FE",
    marginBottom: 20,
  },
  countryButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 10,
  },
  countryName: {
    fontFamily: "Outfit",
    fontSize: 18,
    color: "#000000",
  },
  problemGroup: {
    marginBottom: 15,
  },
});
