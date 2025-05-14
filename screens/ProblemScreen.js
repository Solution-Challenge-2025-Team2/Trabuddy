import React, { useState, useEffect } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Frame from "../Frame";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { problemDescriptions } from "../data/ProblemDescriptions";
import * as Speech from "expo-speech";
import sos from "../data/SosNum.json";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.95;
const countryCode = "BH"; // 국가 코드 (예: "KR" 또는 "US")

const PROBLEM_DATA = [
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
        sos[countryCode].police,
        "🚒 fire: ",
        sos[countryCode].fire,
        "🚑 ambulance: ",
        sos[countryCode].ambulance,
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
  useEffect(() => {
    // 문제 데이터 - 모든 카드를 그라데이션으로 통일
    const PROBLEM_DATA = [
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
            sos[countryCode].police,
            "🚒 fire: ",
            sos[countryCode].fire,
            "🚑 ambulance: ",
            sos[countryCode].ambulance,
          ],
        },
        icon: require("../assets/figma_images/problem_icon_emergency.png"),
        expanded: false,
      },
      {
        id: "3",
        title: "Alert Messages",
        description: "",
        icon: require("../assets/figma_images/problem_icon_alert.png"),
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
  }, [countryCode]);
  const [problems, setProblems] = useState(PROBLEM_DATA);
  const [speaking, setSpeaking] = useState("");

  const [countryCode, setCountryCode] = useState("BH"); // 국가 코드 상태 추가

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
            <Text style={styles.headerText}>
              What Problems{"\n"}are you facing?
            </Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
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
                    <Text style={styles.cardTitle}>{problem.title}</Text>
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
                              numbers={sos[countryCode].police}
                              onPressNumber={callNumber}
                            />

                            {/* fire 번호 */}
                            <Text style={styles.cardDescription}>🚒 fire:</Text>
                            <EmergencyNumbersRow
                              numbers={sos[countryCode].fire}
                              onPressNumber={callNumber}
                            />

                            {/* ambulance 번호 */}
                            <Text style={styles.cardDescription}>
                              🚑 ambulance:
                            </Text>
                            <EmergencyNumbersRow
                              numbers={sos[countryCode].ambulance}
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
    color: FIGMA_COLORS.primaryText,
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
    backgroundColor: FIGMA_COLORS.white,
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
  cardTitle: {
    fontFamily: "OriginalSurfer",
    fontSize: 26,
    color: FIGMA_COLORS.white,
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
    color: FIGMA_COLORS.primaryText,
    lineHeight: 24,
  },
  cardTitle: {
    fontFamily: "Outfit",
    fontSize: 22,
    color: FIGMA_COLORS.primaryText,
    marginBottom: 10,
  },
  cardSubtitle: {
    fontFamily: "Outfit",
    fontSize: 20,
    color: FIGMA_COLORS.primaryText,
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
});
