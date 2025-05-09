import React, { useRef } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
  Ionicons
} from "@expo/vector-icons";
import Frame from "../Frame";
import { useChat } from "../context/ChatContext"; // 채팅 컨텍스트 사용

// 앱의 주요 색상 정의
const COLORS = {
  primary: "#40ABE5",
  primaryDark: "#00527E",
  lightBg: "#F6FEFF",
  white: "#FFFFFF",
  textDark: "#222222",
  textMedium: "#444444",
  textLight: "#666666",
  shadow: "#000000",
  accentPink: "#FF38A2",
  accentGreen: "#408A00",
  accentOrange: "#E66F00",
  accentRed: "#B60000",
};

export default function MainScreen() {
  const navigation = useNavigation();
  const { messages, isChatActive, addMessage } = useChat(); // 컨텍스트에서 함수와 상태 가져오기
  const scrollViewRef = useRef(null);

  // 페이지 이동 시 키보드 내리는 함수
  const navigateAndDismissKeyboard = (screenName) => {
    Keyboard.dismiss(); // 키보드 내리기

    // 키보드가 내려간 후 네비게이션 실행
    setTimeout(() => {
      navigation.navigate(screenName);
    }, 50); // 50ms 지연
  };

  // AI Travel Assistant 버튼 클릭 핸들러
  const handleAssistantPress = () => {
    Keyboard.dismiss(); // 키보드 내리기
    // 앱에서 바로 AI 메시지 추가 (isUser = false)
    addMessage("Ask me anything you're curious about", false);
  };

  // 메시지 렌더링 함수
  const renderMessage = (message) => {
    if (message.isUser) {
      // 사용자 메시지 - 오른쪽 정렬
      return (
        <View key={message.id} style={styles.userMessageContainer}>
          <View style={[styles.messageBubble, styles.userMessageBubble]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        </View>
      );
    } else {
      // AI 메시지 - 왼쪽 정렬 + 프로필 이미지
      return (
        <View key={message.id} style={styles.botMessageContainer}>
          <View style={styles.botProfileContainer}>
            <Image
              source={require('../assets/figma_images/trabuddy_face.png')}
              style={styles.botProfileImage}
            />
          </View>
          <View style={[styles.messageBubble, styles.botMessageBubble]}>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        </View>
      );
    }
  };

  return (
    <Frame>
      {!isChatActive ? (
        // 기본 메인 화면 UI
        <>
          {/* 프로필 섹션 */}
          <View style={styles.profileSection}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.profileImageContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Image
                source={require('../assets/figma_images/trabuddy_face.png')}
                style={styles.profileImage}
              />
            </LinearGradient>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.nickname}>Nickname</Text>
            </View>
          </View>

          {/* 주요 기능 그리드 */}
          <View style={styles.contentBox}>
            <Text style={styles.sectionTitle}>Travel Services</Text>

            <View style={styles.gridContainer}>
              {/* 첫 번째 줄 */}
              <View style={styles.gridRow}>
                {/* 역사/문화 아이콘 */}
                <TouchableOpacity
                  style={styles.iconWrapper}
                  onPress={() => navigateAndDismissKeyboard("HistoryCulture")}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[COLORS.accentPink, "#992261"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconBox}
                  >
                    <FontAwesome5 name="university" size={40} color={COLORS.white} />
                  </LinearGradient>
                  <Text style={styles.iconText}>History &{"\n"}Culture</Text>
                </TouchableOpacity>

                {/* 개인 컨텐츠 아이콘 */}
                <TouchableOpacity
                  style={styles.iconWrapper}
                  onPress={() => navigateAndDismissKeyboard("PersonalContent")}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[COLORS.accentGreen, "#225500"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconBox}
                  >
                    <MaterialIcons name="attractions" size={40} color={COLORS.white} />
                  </LinearGradient>
                  <Text style={styles.iconText}>Personal{"\n"}Content</Text>
                </TouchableOpacity>
              </View>

              {/* 두 번째 줄 */}
              <View style={styles.gridRow}>
                {/* 여행 준비 아이콘 */}
                <TouchableOpacity
                  style={styles.iconWrapper}
                  onPress={() => navigateAndDismissKeyboard("PrepareTravels")}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[COLORS.accentOrange, "#A94D00"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconBox}
                  >
                    <MaterialIcons name="luggage" size={40} color={COLORS.white} />
                  </LinearGradient>
                  <Text style={styles.iconText}>Prepare{"\n"}Travel</Text>
                </TouchableOpacity>

                {/* 응급 상황 아이콘 */}
                <TouchableOpacity
                  style={styles.iconWrapper}
                  onPress={() => navigateAndDismissKeyboard("Emergency")}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[COLORS.accentRed, "#850000"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconBox}
                  >
                    <MaterialCommunityIcons name="medical-bag" size={40} color={COLORS.white} />
                  </LinearGradient>
                  <Text style={styles.iconText}>Emergency</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* AI 어시스턴트 안내 */}
          <TouchableOpacity
            style={styles.askBoxContainer}
            activeOpacity={0.9}
            onPress={handleAssistantPress}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.askBox}
            >
              <View style={styles.askBoxContent}>
                <View style={styles.askBoxIconContainer}>
                  <Ionicons name="chatbubble-ellipses" size={32} color={COLORS.white} />
                </View>
                <View style={styles.askBoxTextContainer}>
                  <Text style={styles.askTitle}>AI Travel Assistant</Text>
                  <Text style={styles.askText}>
                    Ask me anything you're curious about
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
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
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map(renderMessage)}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Frame>
  );
}

const styles = StyleSheet.create({
  // 프로필 섹션 스타일
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  profileImageContainer: {
    width: 86,
    height: 86,
    borderRadius: 43,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImage: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  greetingContainer: {
    marginLeft: 16,
  },
  greeting: {
    fontSize: 20,
    fontFamily: "Outfit",
    color: COLORS.textMedium,
    marginBottom: 2,
  },
  nickname: {
    fontSize: 32,
    fontFamily: "Outfit",
    fontWeight: "bold",
    color: COLORS.textDark,
  },

  // 컨텐츠 박스 스타일
  contentBox: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: "Outfit",
    fontWeight: "bold",
    color: COLORS.textDark,
    marginLeft: 8,
    marginBottom: 16,
  },
  gridContainer: {
    width: "100%",
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  iconWrapper: {
    alignItems: "center",
    width: '48%',
    marginHorizontal: 2,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 10,
  },
  iconText: {
    fontFamily: "Outfit",
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textDark,
    textAlign: "center",
    lineHeight: 22,
  },

  // AI 어시스턴트 안내 박스
  askBoxContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  askBox: {
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  askBoxContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  askBoxIconContainer: {
    marginRight: 16,
  },
  askBoxTextContainer: {
    flex: 1,
  },
  askTitle: {
    fontSize: 18,
    fontFamily: "Outfit",
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 4,
  },
  askText: {
    fontFamily: "Outfit",
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
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
  // 사용자 메시지 스타일
  userMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  // AI 메시지 스타일
  botMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  // AI 프로필 이미지 영역
  botProfileContainer: {
    marginRight: 8,
  },
  // AI 프로필 이미지
  botProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 14,
    borderRadius: 20,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userMessageBubble: {
    backgroundColor: '#E3F2FD',
    alignSelf: 'flex-end',
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  botMessageBubble: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Outfit',
    color: COLORS.textDark,
  },
});
