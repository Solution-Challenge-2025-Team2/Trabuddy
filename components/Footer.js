import { View, Text, StyleSheet } from "react-native";

export default function Footer() {
  return (
    <View style={styles.footer}>
      <Text>Prompt here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: "#eee",
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
});
