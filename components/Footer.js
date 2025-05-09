import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TextInput } from "react-native";
import { useState, useEffect } from "react";

export default function Footer() {
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (message.trim() === '') return;

    // 전역 함수를 통해 메인 화면으로 메시지 전달
    if (typeof window.sendMessageToMain === 'function') {
      window.sendMessageToMain(message);
      setMessage('');
    } else {
      console.warn('sendMessageToMain is not defined. Message will not be sent to main screen.');
    }
  };

  const handleVoiceInput = () => {
    // 음성 입력 기능 구현 (향후 구현)
    console.log('Voice input pressed');
  };

  return (
    <View style={styles.footer}>
      <View style={styles.inputContainer}>
        <View style={styles.promptBox}>
          <View style={styles.PromptInput}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your message..."
              placeholderTextColor="#888"
              value={message}
              onChangeText={setMessage}
              onSubmitEditing={handleSendMessage}
            />
          </View>
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
          >
            <MaterialIcons name="send" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.voiceButton}
          onPress={handleVoiceInput}
        >
          <MaterialIcons name="keyboard-voice" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  promptBox: {
    flexDirection: "row",
    alignItems: "center",
    width: "70%",
    height: 60,
    backgroundColor: "#F5F7FE",
    borderRadius: 40,
    paddingHorizontal: 20,
    marginRight: 12,
  },
  PromptInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 10,
  },
  sendButton: {
    backgroundColor: "#6DC0ED",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  voiceButton: {
    backgroundColor: "#6DC0ED",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  textInput: {
    fontSize: 16,
    fontFamily: "Outfit", // 폰트 설정
    color: "black",
  },
});
