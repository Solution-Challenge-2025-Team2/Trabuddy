import React, { useState, useEffect, useRef, use } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Frame from "../Frame";
import { Ionicons } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.85;

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

// 예시 데이터
const HISTORY_CULTURE_DATA = [
  {
    id: "1",
    title: "History of Korea",
    description:
      "Korea has a rich history spanning over 5,000 years, from ancient kingdoms to modern times...",
    icon: "history",
  },
  {
    id: "2",
    title: "Korean Traditional Culture",
    description:
      "Korean traditional culture includes various aspects such as Hanbok (traditional clothing), traditional music, dance, and more...",
    icon: "palette",
  },
  {
    id: "3",
    title: "Korean Food Culture",
    description:
      "Korean cuisine is known for its bold flavors, variety of side dishes and has been influenced by natural and cultural trends...",
    icon: "restaurant",
  },
];

export default function HistoryCultureScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");

  const searchRef = useRef(null); // 검색창 필드

  useEffect(() => {
    if (searchRef.current) {
      searchRef.current.setNativeProps({
        style: { fontFamily: "Outfit", fontSize: 15 },
      });
    }
  }, []); // 검색창 폰트 설정

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

          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={24}
              color="#999"
              style={styles.searchIcon}
            />
            <TextInput
              ref={searchRef}
              style={styles.searchInput}
              placeholder="Search for history and culture..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            {HISTORY_CULTURE_DATA.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.cardContainer}
                activeOpacity={0.9}
              >
                <View style={styles.cardImageContainer}>
                  <MaterialIcons name={item.icon} size={70} color="#40ABE5" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDescription} numberOfLines={3}>
                    {item.description}
                  </Text>
                  <TouchableOpacity style={styles.readMoreButton}>
                    <Text style={styles.readMoreText}>Read More</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
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
  searchContainer: {
    flexDirection: "row",
    backgroundColor: FIGMA_COLORS.white,
    borderRadius: 25,
    padding: 10,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchIcon: {
    marginHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Outfit",
    fontSize: 16,
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 30,
  },
  cardContainer: {
    width: "100%",
    backgroundColor: FIGMA_COLORS.white,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  cardImageContainer: {
    width: "100%",
    height: 180,
    backgroundColor: "#E6F5FD",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    padding: 15,
  },
  cardTitle: {
    fontFamily: "OriginalSurfer",
    fontSize: 22,
    marginBottom: 8,
    color: FIGMA_COLORS.primaryText,
  },
  cardDescription: {
    fontFamily: "Outfit",
    fontSize: 14,
    color: FIGMA_COLORS.secondaryText,
    lineHeight: 20,
    marginBottom: 15,
  },
  readMoreButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 15,
    backgroundColor: "#EEF7FB",
    borderRadius: 15,
  },
  readMoreText: {
    fontFamily: "Outfit",
    fontSize: 14,
    color: "#40ABE5",
  },
});
