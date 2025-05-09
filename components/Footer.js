import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TextInput } from "react-native";
import { useState } from "react";
import { useChat } from "../context/ChatContext"; // 채팅 컨텍스트 추가
import { useNavigation, useRoute } from "@react-navigation/native"; // 네비게이션 추가

export default function Footer() {
  const [message, setMessage] = useState('');
  const { addMessage } = useChat(); // 채팅 컨텍스트에서 addMessage 함수 가져오기
  const navigation = useNavigation(); // 네비게이션 객체
  const route = useRoute(); // 현재 경로

  const handleSendMessage = () => {
    if (message.trim() === '') return;

    // 메시지 전송 및 입력창 초기화
    addMessage(message);
    setMessage('');

    // 현재 화면이 Main이 아니면 Main으로 이동
    if (route.name !== "Main") {
      navigation.navigate("Main");
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
