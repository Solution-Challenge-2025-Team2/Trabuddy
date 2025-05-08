import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import Frame from "../Frame";

export default function MainScreen() {
  const navigation = useNavigation();

  return (
    <Frame>
      <View style={styles.profileSection}>
        <Image
          source={{ uri: "https://randomuser.me/api/portraits/women/65.jpg" }}
          style={styles.profileImage}
        />
        <View style={{ marginLeft: 16 }}>
          <Text style={styles.greeting}>Hi</Text>
          <Text style={styles.nickname}>Nickname</Text>
        </View>
      </View>
      <View style={styles.contentBox}>
        <View style={styles.gridRow}>
          <View style={styles.iconColumn}>
            <TouchableOpacity
              onPress={() => navigation.navigate("HistoryCulture")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#FF38A2", "#992261"]}
                start={{ x: 0.24, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconBox}
              >
                <FontAwesome5 name="university" size={50} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.iconTextBelow}>History{"\n"}Culture</Text>
          </View>
          <View style={styles.iconColumn}>
            <TouchableOpacity
              onPress={() => navigation.navigate("PersonalContent")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#408A00", "#112400"]}
                start={{ x: 0.27, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconBox}
              >
                <MaterialIcons name="attractions" size={50} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.iconTextBelow}>Personal{"\n"}Content</Text>
          </View>
        </View>
        <View style={styles.gridRow}>
          <View style={styles.iconColumn}>
            <TouchableOpacity
              onPress={() => navigation.navigate("PrepareTravels")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#E66F00", "#E66F00"]}
                start={{ x: 0.26, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconBox}
              >
                <MaterialIcons name="luggage" size={50} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.iconTextBelow}>Prepare{"\n"}Travel</Text>
          </View>
          <View style={styles.iconColumn}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Emergency")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#B60000", "#B60000"]}
                start={{ x: 0.35, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconBox}
              >
                <MaterialCommunityIcons
                  name="medical-bag"
                  size={50}
                  color="#fff"
                />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.iconTextBelow}>Emergency</Text>
          </View>
        </View>
      </View>
      <View style={styles.askBox}>
        <Text style={styles.askText}>
          Ask me anything you're{"\n"}curious about
        </Text>
      </View>
    </Frame>
  );
}

const styles = StyleSheet.create({
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginLeft: 32,
    marginBottom: 8,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#fff",
  },
  greeting: {
    fontSize: 32,
    fontFamily: "Outfit",
    color: "#222",
  },
  nickname: {
    fontSize: 32,
    fontFamily: "Outfit",
    color: "#222",
  },
  contentBox: {
    backgroundColor: "#F6FEFF",
    borderRadius: 30,
    marginHorizontal: 18,
    marginTop: 8,
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    alignSelf: "center",
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    width: "110%",
    marginBottom: 12,
    marginTop: 12,
  },
  iconColumn: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    minWidth: 100,
    minHeight: 130,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 0,
    marginVertical: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 3,
  },
  iconTextBelow: {
    color: "#222",
    fontFamily: "OriginalSurfer",
    fontSize: 19,
    textAlign: "center",
    marginTop: 5,
    lineHeight: 20,
    minHeight: 38,
    maxWidth: 100,
  },
  askBox: {
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 0,
    minHeight: 40,
  },
  askText: {
    fontFamily: "Outfit",
    fontSize: 20,
    color: "#555",
    textAlign: "center",
    lineHeight: 28,
  },
});
