import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Frame from "../Frame";

const Sidebar = ({ navigation }) => {
  return (
    <Frame AppName="" disableBackground={true}>
      <TouchableOpacity onPress={() => navigation.navigate("Main")}>
        <Text style={styles.link}>Chat</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("History/Culture")}>
        <Text style={styles.link}>History/Culture</Text>
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
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    justifyContent: "center",
  },
  link: {
    fontSize: 18,
    marginVertical: 10,
    color: "black",
  },
});

export default Sidebar;
