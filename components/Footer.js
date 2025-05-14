import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TextInput, Alert } from "react-native";
import { useState, useEffect, useRef } from "react";
import { useChat } from "../context/ChatContext"; // 채팅 컨텍스트 추가
import { useNavigation, useRoute } from "@react-navigation/native"; // 네비게이션 추가
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import { Animated, Easing } from "react-native"; // 애니메이션 추가

export default function Footer() {
  const [message, setMessage] = useState("");
  const { addMessage, isLoading } = useChat();
  const navigation = useNavigation(); // 네비게이션 객체
  const route = useRoute(); // 현재 경로

  const recordingRef = useRef(null);
  const [recording, setRecording] = useState(false);

  // 1. 자동 전송을 위한 ref 사용
  const isAutoSending = useRef(false);

  const scaleAnim = useRef(new Animated.Value(1)).current; // 애니메이션

  // 2. message가 바뀌었을 때 자동 전송
  useEffect(() => {
    if (isAutoSending.current && message.trim() !== "") {
      handleSendMessage();
      isAutoSending.current = false;
    }
  }, [message]);

  // 음성 버튼 클릭 시 호출 함수
  const handleVoiceInput = async () => {
    try {
      if (!recording) {
        // 🎤 녹음 시작
        const permission = await Audio.requestPermissionsAsync();
        if (permission.status !== "granted") {
          console.log("⛔ 마이크 권한이 필요합니다.");
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recordingRef.current = recording;
        setRecording(recording);
        console.log("🎙️ 녹음 시작");

        // 타이머 설정 (7초 후 자동 종료)
        setTimeout(async () => {
          if (recordingRef.current) {
            await recordingRef.current.stopAndUnloadAsync();
            const uri = recordingRef.current.getURI();
            console.log("✅ 타이머 종료로 녹음 종료: ", uri);
            setRecording(null);

            const base64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });

            console.log("📦 Base64 (앞부분):", base64.slice(0, 100) + "...");
            // 서버에 전송
            const response = await fetch(
              `http://3.106.58.224:3000/speech/transcribe`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ base64Audio: base64 }),
              }
            );
            if (!response.ok) {
              throw new Error(`Server error: ${response.status}`);
            }
            // 5) 서버 응답 저장
            const data = await response.json();
            console.log("🎧 변환된 텍스트:", data.response);
            setMessage(data.response);
          }
        }, 7000); // 7초 후 자동 종료
      } else {
        // ⏹️ 녹음 종료 + base64 변환
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        console.log("✅ 녹음 종료: ", uri);
        setRecording(null);

        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        console.log("📦 Base64 (앞부분):", base64.slice(0, 100) + "...");
        // server에 전송
        const response = await fetch(
          `http://3.106.58.224:3000/speech/transcribe`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ base64Audio: base64 }),
          }
        );
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        // 5) 서버 응답 저장
        const data = await response.json();
        console.log("🎧 변환된 텍스트:", data.response);

        setMessage(data.response);
        isAutoSending.current = true; // 자동 전송 설정
      }
    } catch (error) {
      console.error("❗ handleVoiceInput 오류:", error);
    }
  };
  // 음성 버튼 애니메이션
  useEffect(() => {
    if (recording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.5,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // 🔚 녹음 중이 아니면 애니메이션 중단 및 초기화
      scaleAnim.setValue(1);
    }
  }, [recording]);

  // 메시지 전송 버튼
  const handleSendMessage = () => {
    if (message.trim() === "" || isLoading) return;

    // 메시지 전송 및 입력창 초기화
    addMessage(message);
    setMessage("");

    // 키보드 내리기
    Keyboard.dismiss();

    // 현재 화면이 Main이 아니면 Main으로 이동
    if (route.name !== "Main") {
      // 키보드가 내려간 후 네비게이션 실행
      setTimeout(() => {
        navigation.navigate("Main");
      }, 50); // 50ms 지연
    }
  };

  return (
    <View style={styles.footer}>
      <View style={styles.inputContainer}>
        <View
          style={[
            styles.promptBox,
            isLoading && styles.promptBoxDisabled,
            recording && { opacity: 0.3 },
          ]}
        >
          <View style={styles.PromptInput}>
            <TextInput
              style={styles.textInput}
              placeholder={
                isLoading ? "Waiting for message..." : "Type your message..."
              }
              placeholderTextColor={isLoading ? "#999" : "#888"}
              value={message}
              onChangeText={setMessage}
              onSubmitEditing={handleSendMessage}
              editable={!isLoading && !recording}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, isLoading && styles.buttonDisabled]}
            onPress={handleSendMessage}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialIcons name="send" size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[styles.voiceButton, isLoading && styles.buttonDisabled]}
            onPress={handleVoiceInput}
            disabled={isLoading}
          >
            <MaterialIcons name="keyboard-voice" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
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
  promptBoxDisabled: {
    backgroundColor: "#F0F0F0",
    opacity: 0.8,
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
  buttonDisabled: {
    backgroundColor: "#A9D7F0",
    opacity: 0.7,
  },
  textInput: {
    fontSize: 16,
    fontFamily: "Outfit", // 폰트 설정
    color: "black",
  },
});
