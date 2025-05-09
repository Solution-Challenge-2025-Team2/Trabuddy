import React, { useState, useEffect, useRef } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import Frame from "../Frame";

// 샘플 메시지 데이터
const initialMessages = [];

export default function MainScreen() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [showChatInterface, setShowChatInterface] = useState(false);
  const scrollViewRef = useRef(null);

  // Footer 컴포넌트로부터 메시지를 받는 함수
  useEffect(() => {
    // 전역 이벤트 리스너를 설정할 수 있음
    // 여기서는 예시로 구현하지 않음
  }, []);

  // 가상의 API 응답을 시뮬레이션하는 함수
  const getAIResponse = async (userMessage) => {
    // 실제 구현에서는, 여기서 API를 호출합니다
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          text: `당신의 메시지 "${userMessage}"에 대한 응답입니다. 어떻게 도와드릴까요?`,
          timestamp: new Date().toISOString()
        });
      }, 1000);
    });
  };

  // 새 메시지를 추가하는 함수
  const addMessage = async (text, isUser = true) => {
    const newMessage = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date().toISOString()
    };

    // 메시지 목록에 새 메시지 추가
    setMessages(prevMessages => [...prevMessages, newMessage]);

    // 채팅 인터페이스로 전환
    setShowChatInterface(true);

    // 사용자 메시지에 대한 AI 응답 처리
    if (isUser) {
      const response = await getAIResponse(text);
      const aiMessage = {
        id: Date.now().toString() + '-ai',
        text: response.text,
        isUser: false,
        timestamp: response.timestamp
      };
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    }

    // 스크롤 뷰를 맨 아래로 스크롤
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Footer에서 메시지를 보낼 때 호출될 함수
  const handleSendMessage = (text) => {
    if (text.trim()) {
      addMessage(text);
      setInputValue('');
    }
  };

  // 전역에서 Footer의 메시지 입력을 처리할 함수
  // 이 함수는 어느 화면에서든 프롬프트에 입력한 메시지를 처리할 수 있게 합니다
  window.sendMessageToMain = handleSendMessage;

  return (
    <Frame>
      {!showChatInterface ? (
        // 기본 메인 화면 UI
        <>
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
        </>
      ) : (
        // 채팅 인터페이스 UI
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 20}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.isUser
                    ? styles.userMessageBubble
                    : styles.botMessageBubble,
                ]}
              >
                <Text style={styles.messageText}>{message.text}</Text>
              </View>
            ))}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
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
  // 채팅 인터페이스 스타일
  chatContainer: {
    flex: 1,
    width: '100%',
  },
  messagesContainer: {
    flex: 1,
    width: '100%',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 60,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 20,
    marginBottom: 10,
  },
  userMessageBubble: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
    borderTopRightRadius: 4,
  },
  botMessageBubble: {
    backgroundColor: '#F1F0F0',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Outfit',
    color: '#222',
  },
});
