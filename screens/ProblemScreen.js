import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Frame from "../Frame";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { problemDescriptions } from "../data/ProblemDescriptions";
import * as Speech from "expo-speech";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.95;

// TTS 기능 추가
const speak = (text) => {
  Speech.stop();
  Speech.speak(text, {
    language: "en-US",
    rate: 0.9,
    pitch: 1.0,
  });
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

// 문제 데이터 - 모든 카드를 그라데이션으로 통일
const PROBLEM_DATA = [
  {
    id: "1",
    title: "Lost Items",
    description: problemDescriptions.lost,
    icon: require("../assets/figma_images/lost_icon.png"),
    expanded: false,
  },
  {
    id: "2",
    title: "Emergency",
    description:
      "In case of emergency, please call local emergency services (119) or contact the nearest hospital. For international assistance, contact your embassy.",
    icon: require("../assets/figma_images/emergency_icon.png"),
    expanded: false,
  },
  {
    id: "3",
    title: "Problem #1",
    description: "Description and solution for problem #1...",
    icon: require("../assets/figma_images/problem1_icon.png"),
    expanded: false,
  },
  {
    id: "4",
    title: "Problem #2",
    description: "Description and solution for problem #2...",
    icon: require("../assets/figma_images/problem2_icon.png"),
    expanded: false,
  },
];

export default function EmergencyScreen() {
  const [problems, setProblems] = useState(PROBLEM_DATA);

  const toggleExpand = (id) => {
    setProblems(
      problems.map((problem) =>
        problem.id === id
          ? { ...problem, expanded: !problem.expanded }
          : problem
      )
    );
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
                        {problem.id === "1" ? (
                          problem.description.map((item) => (
                            <View key={item.id} style={styles.problemGroup}>
                              {/* 제목 */}
                              <Text style={styles.cardSubtitle}>
                                {item.title}
                              </Text>

                              {/* 단계별 안내 (steps) */}
                              {item.steps.map((step, index) => (
                                <View
                                  key={`step-${index}`}
                                  style={styles.descriptionRow}
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

                              {/* 유의사항/팁 (tips) */}
                              {item.tips.map((tip, index) => (
                                <View
                                  key={`tip-${index}`}
                                  style={styles.descriptionRow}
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
                          <View style={styles.descriptionRow}>
                            <Text style={styles.cardDescription}>
                              {problem.description}
                            </Text>
                            <TouchableOpacity
                              onPress={() => speak(problem.description)}
                            >
                              <MaterialIcons
                                name="volume-up"
                                size={20}
                                color="#40ABE5"
                              />
                            </TouchableOpacity>
                          </View>
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
  cardSubtitle: {
    fontFamily: "Outfit",
    fontSize: 20,
    color: FIGMA_COLORS.primaryText,
    marginBottom: 10,
  },
  descriptionRow: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6,
    marginBottom: 8,
  },
});
