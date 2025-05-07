import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Frame from "../Frame";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const Sidebar = ({ navigation }) => {
  return (
    <Frame AppName="" disableBackground={true} style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.navigate("Main")}
        style={styles.Chat}
      >
        <Text style={styles.link}>Chat</Text>
        <MaterialCommunityIcons
          name="chat-plus-outline"
          size={50}
          color="black"
          style={styles.link}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("PersonalContent")}>
        <Text style={styles.link}>PersonalContent</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("PrepareTravels")}>
        <Text style={styles.link}>Prepare Travels</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Emergency")}>
        <Text style={styles.link}>Emergency</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("MyPage")}>
        <Text style={styles.link}>My Page</Text>
      </TouchableOpacity>
    </Frame>
  );
};

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  Chat: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 30,
  },
  link: {
    fontFamily: "OriginalSurfer",
    fontSize: 32,
    marginVertical: 10,
    color: "black",
    paddingBottom: 10,
    paddingLeft: 30,
    textShadowColor: "#89D6FF", // 그림자 색상
    textShadowOffset: { width: 0, height: 4 }, // 그림자 오프셋 (0, 4)
    textShadowOpacity: 1, // 그림자 불투명도 (100%)
    textShadowRadius: 4, // 그림자 반경 (4)
    elevation: 5, // 안드로이드에서 그림자 효과를 주기 위한 설정
  },
});

export default Sidebar;
