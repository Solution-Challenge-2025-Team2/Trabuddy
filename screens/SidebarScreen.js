import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const Sidebar = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate("Main")}>
        <Text style={styles.link}>Chat</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Problems")}>
        <Text style={styles.link}>Problems</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    justifyContent: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  link: {
    fontSize: 18,
    marginVertical: 10,
    color: "blue",
  },
});

export default Sidebar;
