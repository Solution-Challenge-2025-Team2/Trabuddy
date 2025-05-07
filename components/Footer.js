import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TextInput } from "react-native";

export default function Footer() {
  return (
    <View style={styles.footer}>
      <View style={styles.promptBox}>
        <View style={styles.PromptInput}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            placeholderTextColor="#888"
          />
        </View>
        <View style={styles.voiceButton}>
          <MaterialIcons name="keyboard-voice" size={30} color="white" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  promptBox: {
    flexDirection: "row",
    alignItems: "center",
    width: "78%",
    height: 60,
    backgroundColor: "#F5F7FE",
    borderRadius: 40,
    paddingHorizontal: 20,
  },
  PromptInput: {
    flex: 20,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 10,
  },
  voiceButton: {
    backgroundColor: "#6DC0ED",
    borderRadius: 20,
  },
  textInput: {
    fontSize: 16,
    fontFamily: "Outfit", // 폰트 설정
    color: "black",
  },
});
