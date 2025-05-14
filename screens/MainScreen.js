import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import Frame from "../Frame";
import { useChat } from "../context/ChatContext"; // Use chat context
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define app's main colors
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
  const {
    messages,
    isChatActive,
    addMessage,
    isLoading,
    isLoggedIn,
    setIsLoggedIn,
  } = useChat(); // Get functions and state from context
  const scrollViewRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false); // TTS running state

  // 컴포넌트 마운트 시 로그인 상태 확인 및 업데이트
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");
        console.log("MainScreen - 토큰 확인:", token ? "있음" : "없음");

        // 토큰이 있으면 로그인 상태로 설정
        if (token) {
          if (!isLoggedIn) {
            console.log(
              "MainScreen - 토큰은 있지만 로그인 상태가 false여서 true로 업데이트"
            );
            setIsLoggedIn(true);
          } else {
            console.log("MainScreen - 토큰 있음, 로그인 상태 이미 true");
          }
        } else {
          if (isLoggedIn) {
            console.log(
              "MainScreen - 토큰이 없지만 로그인 상태가 true여서 false로 업데이트"
            );
            setIsLoggedIn(false);
          } else {
            console.log("MainScreen - 토큰 없음, 로그인 상태 이미 false");
          }
        }
      } catch (error) {
        console.error("MainScreen - 로그인 상태 확인 오류:", error);
      }
    };

    checkLoginStatus();
  }, [isLoggedIn, setIsLoggedIn]);

  // Function to automatically scroll to bottom
  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  // Scroll down when messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Short delay before scrolling - to ensure rendering is complete
      setTimeout(scrollToBottom, 100);
    }
  }, [messages]);

  // Function to check if TTS is running
  useEffect(() => {
    const checkSpeechStatus = async () => {
      const speaking = await Speech.isSpeakingAsync();
      setIsSpeaking(speaking);
    };

    // Check status every 500ms
    const interval = setInterval(checkSpeechStatus, 500);
    return () => clearInterval(interval);
  }, []);

  // Function to dismiss keyboard when navigating
  const navigateAndDismissKeyboard = (screenName) => {
    Keyboard.dismiss(); // Dismiss keyboard

    // Execute navigation after keyboard is dismissed
    setTimeout(() => {
      navigation.navigate(screenName);
    }, 50); // 50ms delay
  };

  // AI Travel Assistant button click handler
  const handleAssistantPress = () => {
    Keyboard.dismiss(); // Dismiss keyboard
    // Add AI message directly in the app (isUser = false)
    addMessage("Ask me anything you're curious about", false);
  };

  // TTS function: convert text to speech
  const speakText = (text) => {
    if (isSpeaking) {
      // Stop if already speaking
      Speech.stop();
      setIsSpeaking(false);
    } else {
      // Start reading new text
      setIsSpeaking(true);

      Speech.speak(text, {
        language: "en-US",
        rate: 0.9,
        pitch: 1.0,
        onDone: () => setIsSpeaking(false), // Update state when complete
        onStopped: () => setIsSpeaking(false), // Update state when stopped
        onError: () => setIsSpeaking(false), // Update state on error
      });
    }
  };

  // Message rendering function
  const renderMessage = (message) => {
    // Process message text (use answer field if object)
    let messageText = message.text;
    let imageUrl = null;
    let responseCategory = null; // 카테고리 정보 저장 변수 추가

    // 디버깅: 메시지 구조 출력
    console.log("renderMessage - 메시지 ID:", message.id);
    console.log("renderMessage - 메시지 타입:", typeof message.text);

    // Handle if object
    if (typeof message.text === "object" && message.text !== null) {
      console.log("renderMessage - 객체 키:", Object.keys(message.text));

      // 카테고리 정보 추출
      if (message.text.category) {
        responseCategory = message.text.category;
        console.log("renderMessage - 카테고리 발견:", responseCategory);
      }

      // summary 필드가 있으면 summary를 텍스트로 표시
      if (message.text.summary) {
        messageText = message.text.summary;
      } else if (message.text.answer) {
        // 없으면 answer 필드 표시 (기존 호환성 유지)
        messageText = message.text.answer;
      } else {
        // 둘 다 없으면 객체를 JSON 문자열로 변환
        messageText = JSON.stringify(message.text);
      }

      // 다양한 이미지 URL 속성명 검사
      const possibleImageProps = [
        "image_url",
        "imageURL",
        "imageUrl",
        "image",
        "img_url",
        "imgURL",
        "imgUrl",
        "img",
      ];

      for (const prop of possibleImageProps) {
        if (message.text[prop]) {
          imageUrl = message.text[prop];
          console.log(`renderMessage - 이미지 속성 발견 (${prop}):`, imageUrl);
          break;
        }
      }
    }

    // 메시지 자체에서 이미지 URL 속성 검사 (서버 응답 구조가 다른 경우)
    if (!imageUrl && typeof message === "object") {
      const possibleImageProps = [
        "image_url",
        "imageURL",
        "imageUrl",
        "image",
        "img_url",
        "imgURL",
        "imgUrl",
        "img",
      ];

      for (const prop of possibleImageProps) {
        if (message[prop]) {
          imageUrl = message[prop];
          console.log(
            `renderMessage - 메시지에서 이미지 속성 발견 (${prop}):`,
            imageUrl
          );
          break;
        }
      }
    }

    // 이미지 URL 값 확인
    if (imageUrl) {
      console.log("renderMessage - 최종 이미지 URL:", imageUrl);
    }

    if (message.isUser) {
      // User message - right aligned
      return (
        <View key={message.id} style={styles.userMessageContainer}>
          <View style={[styles.messageBubble, styles.userMessageBubble]}>
            <Text style={styles.messageText}>{messageText}</Text>
          </View>
        </View>
      );
    } else {
      // AI message - left aligned + profile image
      return (
        <View key={message.id} style={styles.botMessageWrapper}>
          {/* 메시지와 프로필 이미지를 포함하는 상단 컨테이너 */}
          <View style={styles.botMessageContainer}>
            <View style={styles.botProfileContainer}>
              <Image
                source={require("../assets/figma_images/trabuddy_face.png")}
                style={styles.botProfileImage}
              />
            </View>

            {/* Main message bubble */}
            <View
              style={[
                styles.messageBubble,
                styles.botMessageBubble,
                message.isError && styles.errorMessageBubble,
              ]}
            >
              <View style={styles.messageContentContainer}>
                <Text
                  style={[
                    styles.messageText,
                    message.isError && styles.errorMessageText,
                  ]}
                >
                  {messageText}
                </Text>

                {/* TTS button */}
                <TouchableOpacity
                  style={styles.ttsButton}
                  onPress={() => speakText(messageText)}
                >
                  <Ionicons
                    name={isSpeaking ? "volume-mute" : "volume-high"}
                    size={16}
                    color={isSpeaking ? "#F44336" : COLORS.primary}
                  />
                </TouchableOpacity>
              </View>

              {/* Show image if available */}
              {imageUrl && (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.messageImage}
                    resizeMode="cover"
                    onError={(e) =>
                      console.log(
                        "이미지 로딩 오류:",
                        e.nativeEvent.error,
                        "- URL:",
                        imageUrl
                      )
                    }
                    onLoad={() => console.log("이미지 로드 성공:", imageUrl)}
                  />
                </View>
              )}

              {/* Show category if available */}
              {responseCategory && (
                <View style={styles.categoryContainer}>
                  <Text style={styles.categoryText}>{responseCategory}</Text>
                </View>
              )}
            </View>
          </View>

          {/* View More Details 버튼 - 메시지 버블 아래에 별도로 위치 */}
          {!message.isUser && !message.isError && (
            <TouchableOpacity
              style={styles.viewMoreButton}
              onPress={() => {
                console.log("View more details 버튼 클릭됨");

                // 디버깅용 로그
                console.log("메시지 객체:", message);
                console.log("메시지 ID:", message.id);
                console.log("responseCategory:", responseCategory);

                // 고유 메시지 ID 생성
                const messageUniqueId = `message_${message.id}`;

                // 비동기 처리를 위한 async 함수 정의 및 호출
                const handleViewMoreDetails = async () => {
                  try {
                    // 전체 응답 데이터 가져오기 (완전한 message 필드 포함 데이터)
                    const lastResponseData = await AsyncStorage.getItem(
                      "last_response_data"
                    );
                    const parsedLastResponseData = lastResponseData
                      ? JSON.parse(lastResponseData)
                      : null;

                    // 현재 메시지 데이터
                    const messageText = message.text;
                    console.log("메시지 텍스트 유형:", typeof messageText);

                    // 완전한 데이터를 찾아야 함 (message 필드 포함)
                    let completeData = null;

                    // 1. 이미 메시지가 완전한 데이터인 경우 (거의 없음)
                    if (
                      typeof messageText === "object" &&
                      messageText !== null &&
                      messageText.message &&
                      typeof messageText.message === "object"
                    ) {
                      console.log(
                        "메시지가 이미 완전한 데이터를 포함하고 있습니다"
                      );
                      completeData = messageText;
                    }
                    // 2. 메시지가 summary를 포함한 객체인 경우 (일반적인 경우)
                    else if (
                      typeof messageText === "object" &&
                      messageText !== null &&
                      messageText.category &&
                      (messageText.summary || messageText.answer)
                    ) {
                      // 해당 메시지의 요약 정보 추출
                      const messageSummary =
                        messageText.summary || messageText.answer;
                      const messageCategory = messageText.category;

                      console.log(
                        `메시지는 요약 정보만 포함: 카테고리=${messageCategory}`
                      );

                      // Last response data에서 일치 여부 확인
                      if (
                        parsedLastResponseData &&
                        parsedLastResponseData.category === messageCategory &&
                        parsedLastResponseData.summary === messageSummary
                      ) {
                        console.log(
                          "last_response_data가 현재 메시지와 일치합니다!"
                        );
                        completeData = parsedLastResponseData;
                      } else {
                        console.log(
                          "last_response_data가 현재 메시지와 일치하지 않습니다. API 데이터를 검색합니다..."
                        );

                        // 추가 검색: AsyncStorage에서 이 메시지를 위해 이전에 저장한 데이터가 있는지 확인
                        try {
                          // 모든 AsyncStorage 키 가져오기
                          const allKeys = await AsyncStorage.getAllKeys();
                          const responseKeys = allKeys.filter(
                            (key) =>
                              key.includes("response_") ||
                              key.includes("message_")
                          );

                          console.log(
                            `${responseKeys.length}개의 응답 데이터 키를 찾았습니다. 일치하는 데이터 검색 중...`
                          );

                          // 모든 저장된 응답 데이터에서 현재 메시지와 일치하는 데이터 찾기
                          let foundMatchingData = false;

                          for (const key of responseKeys) {
                            const storedData = await AsyncStorage.getItem(key);
                            if (storedData) {
                              try {
                                const parsedData = JSON.parse(storedData);

                                // 일치 여부 확인 (카테고리와 요약으로)
                                if (
                                  parsedData.category === messageCategory &&
                                  parsedData.summary === messageSummary
                                ) {
                                  console.log(
                                    `일치하는 데이터를 찾았습니다! 키: ${key}`
                                  );
                                  completeData = parsedData;
                                  foundMatchingData = true;
                                  break;
                                }
                              } catch (e) {
                                console.log(
                                  `${key} 데이터 파싱 실패:`,
                                  e.message
                                );
                              }
                            }
                          }

                          if (!foundMatchingData) {
                            console.log(
                              "일치하는 완전한 데이터를 찾지 못했습니다"
                            );

                            // 임시 해결책: 테스트 데이터 생성 (실제 프로덕션에서는 제거)
                            if (messageCategory === "contents") {
                              console.log(
                                "컨텐츠 카테고리 - 테스트 데이터 생성"
                              );
                              completeData = {
                                category: "contents",
                                message: {
                                  Place: [
                                    {
                                      name: "장소 데이터",
                                      information: "이 장소에 대한 설명입니다.",
                                      imageurl:
                                        "https://images.pexels.com/photos/532826/pexels-photo-532826.jpeg",
                                    },
                                  ],
                                  "F&B": [
                                    {
                                      name: "음식 데이터",
                                      information: "이 음식에 대한 설명입니다.",
                                      imageurl:
                                        "https://images.pexels.com/photos/1446616/pexels-photo-1446616.jpeg",
                                    },
                                  ],
                                  Activity: [
                                    {
                                      name: "활동 데이터",
                                      information: "이 활동에 대한 설명입니다.",
                                      imageurl:
                                        "https://images.pexels.com/photos/17856787/pexels-photo-17856787.jpeg",
                                    },
                                  ],
                                },
                                summary:
                                  messageSummary || "테스트 데이터입니다",
                              };
                            }
                          }
                        } catch (e) {
                          console.error("저장된 응답 데이터 검색 중 오류:", e);
                        }
                      }
                    }

                    // 3. 완전한 데이터를 찾지 못한 경우 최종 fallback
                    if (!completeData) {
                      console.log(
                        "완전한 데이터를 찾지 못했습니다. 기본 데이터 사용"
                      );

                      // 텍스트 또는 부분 객체를 사용
                      if (
                        typeof messageText === "object" &&
                        messageText !== null
                      ) {
                        completeData = messageText;
                      } else {
                        completeData = {
                          text: messageText,
                          category: responseCategory || "unknown",
                        };
                      }
                    }

                    // 데이터 검증
                    console.log("전송할 데이터 유형:", typeof completeData);
                    if (typeof completeData === "object") {
                      console.log(
                        "전송할 데이터 키:",
                        Object.keys(completeData)
                      );

                      // 메시지 필드 확인
                      if (completeData.message) {
                        console.log(
                          "message 필드 있음, 키:",
                          Object.keys(completeData.message)
                        );

                        // 카테고리 데이터 확인
                        const hasPlace =
                          completeData.message.Place &&
                          Array.isArray(completeData.message.Place);
                        const hasFnB =
                          completeData.message["F&B"] &&
                          Array.isArray(completeData.message["F&B"]);
                        const hasActivity =
                          completeData.message.Activity &&
                          Array.isArray(completeData.message.Activity);

                        console.log(
                          `데이터 확인: Place(${hasPlace}), F&B(${hasFnB}), Activity(${hasActivity})`
                        );

                        if (hasPlace || hasFnB || hasActivity) {
                          console.log("콘텐츠 데이터 유효함 ✓");
                        } else {
                          console.warn(
                            "메시지 필드는 있지만 필요한 카테고리 데이터가 없습니다!"
                          );
                        }
                      } else {
                        console.warn("메시지 필드가 없습니다!");
                      }
                    }

                    // 데이터 저장
                    await AsyncStorage.setItem(
                      messageUniqueId,
                      JSON.stringify(completeData)
                    );
                    console.log("응답 데이터 저장 완료:", messageUniqueId);

                    // 활성 메시지 ID 저장
                    await AsyncStorage.setItem(
                      "active_message_id",
                      messageUniqueId
                    );
                    console.log("활성 메시지 ID 저장 완료:", messageUniqueId);

                    // 화면 이동 준비
                    let targetScreen = "PersonalContent"; // 기본 이동 화면

                    // 카테고리에 따른 화면 설정
                    const effectiveCategory =
                      completeData.category || responseCategory;
                    if (effectiveCategory === "historical") {
                      // 역사/문화 카테고리인 경우 HistoryDetail 화면으로 이동
                      console.log('역사/문화 카테고리 - HistoryDetail로 이동');

                      // 이미 저장된 동일한 데이터가 있는지 확인
                      const allKeys = await AsyncStorage.getAllKeys();
                      const histKeys = allKeys.filter(key => key.startsWith('hist_data_'));
                      let existingDataKey = null;
                      let existingData = null;

                      // 데이터 찾기
                      if (histKeys.length > 0) {
                        console.log(`${histKeys.length}개의 역사/문화 데이터 찾음, 일치하는 데이터 검색 중...`);

                        for (const key of histKeys) {
                          try {
                            const storedDataStr = await AsyncStorage.getItem(key);
                            if (storedDataStr) {
                              const storedData = JSON.parse(storedDataStr);

                              // message 필드 비교 (내용 기반 비교)
                              if (storedData.message && completeData.message &&
                                JSON.stringify(storedData.message) === JSON.stringify(completeData.message)) {
                                console.log(`일치하는 데이터 찾음: ${key}`);
                                existingDataKey = key;
                                existingData = storedData;
                                break;
                              }

                              // 메시지 필드가 일치하지 않는 경우 요약 내용과 카테고리로 비교
                              if (!existingData &&
                                storedData.summary && completeData.summary &&
                                storedData.category === 'historical' &&
                                storedData.summary === completeData.summary) {
                                console.log(`요약 내용이 일치하는 데이터 찾음: ${key}`);
                                existingDataKey = key;
                                existingData = storedData;
                                break;
                              }
                            }
                          } catch (e) {
                            console.error(`${key} 데이터 파싱 실패:`, e);
                          }
                        }
                      }

                      let dataToUse;
                      let timestampToUse;

                      if (existingData) {
                        // 기존 데이터 사용
                        console.log('기존 데이터 사용:', existingDataKey);
                        dataToUse = existingData;
                        timestampToUse = existingData.timestamp || parseInt(existingDataKey.replace('hist_data_', ''));
                      } else {
                        // 새 데이터 저장
                        console.log('새 데이터 저장');
                        const timestamp = Date.now();
                        const historicalDataKey = `hist_data_${timestamp}`;

                        // 데이터에 타임스탬프 및 식별 정보 추가
                        const enhancedData = {
                          ...completeData,
                          timestamp,
                          timestampStr: new Date(timestamp).toLocaleString(),
                          key: historicalDataKey
                        };

                        // 향상된 데이터로 저장
                        await AsyncStorage.setItem(historicalDataKey, JSON.stringify(enhancedData));
                        await AsyncStorage.setItem('latest_historical_data_key', historicalDataKey);
                        await AsyncStorage.setItem('historical_data_exists', 'true');
                        await AsyncStorage.setItem('historical_data_timestamp', timestamp.toString());

                        dataToUse = enhancedData;
                        timestampToUse = timestamp;
                      }

                      // 항상 가장 최근 데이터로 historical_culture_data 업데이트
                      await AsyncStorage.setItem('historical_culture_data', JSON.stringify(dataToUse));

                      // HistoryDetail 화면으로 이동, 자동 모달 표시 플래그 추가
                      navigation.navigate('HistoryDetail', {
                        messageData: dataToUse,
                        messageId: messageUniqueId,
                        autoShowModal: true, // 자동으로 모달 표시하기 위한 플래그
                        timestamp: timestampToUse // 타임스탬프 전달
                      });
                      return;
                    } else if (effectiveCategory === "contents") {
                      // 컨텐츠 카테고리인 경우 PersonalContent로 이동
                      console.log("컨텐츠 카테고리 - PersonalContent로 이동");

                      // 이미 저장된 동일한 데이터가 있는지 확인
                      const allKeys = await AsyncStorage.getAllKeys();
                      const contentKeys = allKeys.filter(key => key.startsWith('content_data_'));
                      let existingContentDataKey = null;
                      let existingContentData = null;

                      // 데이터 찾기
                      if (contentKeys.length > 0) {
                        console.log(`${contentKeys.length}개의 컨텐츠 데이터 찾음, 일치하는 데이터 검색 중...`);

                        for (const key of contentKeys) {
                          try {
                            const storedDataStr = await AsyncStorage.getItem(key);
                            if (storedDataStr) {
                              const storedData = JSON.parse(storedDataStr);

                              // message 필드 비교 (내용 기반 비교)
                              if (storedData.message && completeData.message &&
                                JSON.stringify(storedData.message) === JSON.stringify(completeData.message)) {
                                console.log(`일치하는 데이터 찾음: ${key}`);
                                existingContentDataKey = key;
                                existingContentData = storedData;
                                break;
                              }

                              // 메시지 필드가 일치하지 않는 경우 요약 내용과 카테고리로 비교
                              if (!existingContentData &&
                                storedData.summary && completeData.summary &&
                                storedData.category === 'contents' &&
                                storedData.summary === completeData.summary) {
                                console.log(`요약 내용이 일치하는 데이터 찾음: ${key}`);
                                existingContentDataKey = key;
                                existingContentData = storedData;
                                break;
                              }
                            }
                          } catch (e) {
                            console.error(`${key} 데이터 파싱 실패:`, e);
                          }
                        }
                      }

                      let contentDataToUse;
                      let contentTimestampToUse;

                      if (existingContentData) {
                        // 기존 데이터 사용
                        console.log('기존 데이터 사용:', existingContentDataKey);
                        contentDataToUse = existingContentData;
                        contentTimestampToUse = existingContentData.timestamp || parseInt(existingContentDataKey.replace('content_data_', ''));
                      } else {
                        // 새 데이터 저장
                        console.log('새 데이터 저장');
                        const timestamp = Date.now();
                        const contentDataKey = `content_data_${timestamp}`;

                        // 데이터에 타임스탬프 및 식별 정보 추가
                        const enhancedContentData = {
                          ...completeData,
                          timestamp,
                          timestampStr: new Date(timestamp).toLocaleString(),
                          key: contentDataKey
                        };

                        // 향상된 데이터로 저장
                        await AsyncStorage.setItem(contentDataKey, JSON.stringify(enhancedContentData));
                        await AsyncStorage.setItem('latest_content_data_key', contentDataKey);
                        await AsyncStorage.setItem('content_data_exists', 'true');
                        await AsyncStorage.setItem('content_data_timestamp', timestamp.toString());

                        contentDataToUse = enhancedContentData;
                        contentTimestampToUse = timestamp;
                      }

                      // 항상 가장 최근 데이터로 content_data 업데이트
                      await AsyncStorage.setItem('content_data', JSON.stringify(contentDataToUse));

                      // PersonalContent 화면으로 이동, 자동 모달 표시 플래그 추가
                      navigation.navigate('PersonalContent', {
                        messageData: contentDataToUse,
                        messageId: messageUniqueId,
                        autoShowModal: true, // 자동으로 모달 표시하기 위한 플래그
                        timestamp: contentTimestampToUse // 타임스탬프 전달
                      });
                      return;
                    } else if (effectiveCategory === "preparation") {
                      // 준비물 카테고리인 경우 PrepareScreen으로 이동
                      console.log("준비물 카테고리 - PrepareScreen으로 이동");

                      // 이미 저장된 동일한 데이터가 있는지 확인
                      const allKeys = await AsyncStorage.getAllKeys();
                      const prepKeys = allKeys.filter((key) =>
                        key.startsWith("prep_data_")
                      );
                      let existingDataKey = null;
                      let existingData = null;

                      // 데이터 찾기
                      if (prepKeys.length > 0) {
                        console.log(
                          `${prepKeys.length}개의 준비물 데이터 찾음, 일치하는 데이터 검색 중...`
                        );

                        for (const key of prepKeys) {
                          try {
                            const storedDataStr = await AsyncStorage.getItem(
                              key
                            );
                            if (storedDataStr) {
                              const storedData = JSON.parse(storedDataStr);

                              // message 필드 비교 (내용 기반 비교)
                              if (
                                storedData.message &&
                                completeData.message &&
                                JSON.stringify(storedData.message) ===
                                JSON.stringify(completeData.message)
                              ) {
                                console.log(`일치하는 데이터 찾음: ${key}`);
                                existingDataKey = key;
                                existingData = storedData;
                                break;
                              }

                              // 메시지 필드가 일치하지 않는 경우 요약 내용과 카테고리로 비교
                              if (
                                !existingData &&
                                storedData.summary &&
                                completeData.summary &&
                                storedData.category === "preparation" &&
                                storedData.summary === completeData.summary
                              ) {
                                console.log(
                                  `요약 내용이 일치하는 데이터 찾음: ${key}`
                                );
                                existingDataKey = key;
                                existingData = storedData;
                                break;
                              }
                            }
                          } catch (e) {
                            console.error(`${key} 데이터 파싱 실패:`, e);
                          }
                        }
                      }

                      let dataToUse;
                      let timestampToUse;

                      if (existingData) {
                        // 기존 데이터 사용
                        console.log("기존 데이터 사용:", existingDataKey);
                        dataToUse = existingData;
                        timestampToUse =
                          existingData.timestamp ||
                          parseInt(existingDataKey.replace("prep_data_", ""));
                      } else {
                        // 새 데이터 저장
                        console.log("새 데이터 저장");
                        const timestamp = Date.now();
                        const preparationDataKey = `prep_data_${timestamp}`;

                        // 데이터에 타임스탬프 및 식별 정보 추가
                        const enhancedData = {
                          ...completeData,
                          timestamp,
                          timestampStr: new Date(timestamp).toLocaleString(),
                          key: preparationDataKey,
                        };

                        // 향상된 데이터로 저장
                        await AsyncStorage.setItem(
                          preparationDataKey,
                          JSON.stringify(enhancedData)
                        );
                        await AsyncStorage.setItem(
                          "latest_preparation_data_key",
                          preparationDataKey
                        );
                        await AsyncStorage.setItem(
                          "preparation_data_exists",
                          "true"
                        );
                        await AsyncStorage.setItem(
                          "preparation_data_timestamp",
                          timestamp.toString()
                        );

                        dataToUse = enhancedData;
                        timestampToUse = timestamp;
                      }

                      // 항상 가장 최근 데이터로 travel_essentials_data 업데이트
                      await AsyncStorage.setItem(
                        "travel_essentials_data",
                        JSON.stringify(dataToUse)
                      );

                      // PrepareScreen으로 이동, 자동 모달 표시 플래그 추가
                      navigation.navigate("PrepareTravels", {
                        messageData: dataToUse,
                        messageId: messageUniqueId,
                        autoShowModal: true, // 자동으로 모달 표시하기 위한 플래그
                        timestamp: timestampToUse, // 타임스탬프 전달
                      });
                      return;
                    }

                    // 이동할 화면 파라미터 설정 (완전한 데이터 전달)
                    const navigationParams = {
                      messageData: completeData,
                      messageId: messageUniqueId,
                    };

                    console.log(
                      `이동할 화면: ${targetScreen}, 메시지ID: ${messageUniqueId}`
                    );

                    // 화면 이동
                    navigation.navigate(targetScreen, navigationParams);
                  } catch (error) {
                    console.error("View more details 처리 중 오류:", error);

                    // 오류 발생 시 기본 메시지 텍스트 사용
                    const fallbackData = message.text || {
                      text: "데이터 없음",
                    };

                    // 현재 메시지 저장
                    await AsyncStorage.setItem(
                      messageUniqueId,
                      JSON.stringify(fallbackData)
                    );
                    await AsyncStorage.setItem(
                      "active_message_id",
                      messageUniqueId
                    );

                    // 기본 화면으로 이동
                    navigation.navigate("PersonalContent", {
                      messageData: fallbackData,
                      messageId: messageUniqueId,
                    });
                  }
                };

                // 비동기 함수 실행
                handleViewMoreDetails();
              }}
            >
              <Text style={styles.viewMoreText}>View more Details</Text>
            </TouchableOpacity>
          )}
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
                source={require("../assets/figma_images/trabuddy_face.png")}
                style={styles.profileImage}
              />
            </LinearGradient>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>Welcome!</Text>
              <Text style={styles.welcomMessage}>
                {`Let's make today\n a great travel day`}
              </Text>
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
                  onPress={() => navigateAndDismissKeyboard("HistoryDetail")}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[COLORS.accentPink, "#992261"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconBox}
                  >
                    <FontAwesome5
                      name="university"
                      size={40}
                      color={COLORS.white}
                    />
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
                    <MaterialIcons
                      name="attractions"
                      size={40}
                      color={COLORS.white}
                    />
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
                    <MaterialIcons
                      name="luggage"
                      size={40}
                      color={COLORS.white}
                    />
                  </LinearGradient>
                  <Text style={styles.iconText}>Prepare{"\n"}Travel</Text>
                </TouchableOpacity>

                {/* 응급 상황 아이콘 */}
                <TouchableOpacity
                  style={styles.iconWrapper}
                  onPress={() => navigateAndDismissKeyboard("Problem")}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[COLORS.accentRed, "#850000"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconBox}
                  >
                    <MaterialCommunityIcons
                      name="medical-bag"
                      size={40}
                      color={COLORS.white}
                    />
                  </LinearGradient>
                  <Text style={styles.iconText}>Problem</Text>
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
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={32}
                    color={COLORS.white}
                  />
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
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.chatContainer}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={scrollToBottom}
          >
            {messages.map(renderMessage)}

            {/* 로딩 중 표시 */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <View style={styles.botProfileContainer}>
                  <Image
                    source={require("../assets/figma_images/trabuddy_face.png")}
                    style={styles.botProfileImage}
                  />
                </View>
                <View
                  style={[
                    styles.messageBubble,
                    styles.botMessageBubble,
                    styles.loadingBubble,
                  ]}
                >
                  <ActivityIndicator
                    size="small"
                    color="#40ABE5"
                    style={styles.loadingIndicator}
                  />
                  <Text style={styles.loadingText}>답변 작성 중...</Text>
                </View>
              </View>
            )}
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
  welcomMessage: {
    fontSize: 16,
    fontFamily: "Outfit",
    color: COLORS.textMedium,
    marginBottom: 2,
  },
  greeting: {
    fontSize: 30,
    fontFamily: "Outfit",
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
    width: "48%",
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
    width: "100%",
  },
  messagesContainer: {
    flex: 1,
    width: "100%",
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 60,
  },
  // 사용자 메시지 스타일
  userMessageContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  // AI 메시지 스타일
  botMessageContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
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
    maxWidth: "75%",
    padding: 14,
    borderRadius: 20,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userMessageBubble: {
    backgroundColor: "#E3F2FD",
    alignSelf: "flex-end",
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  botMessageBubble: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  messageText: {
    fontSize: 16,
    fontFamily: "Outfit",
    color: COLORS.textDark,
  },

  // 에러 메시지 스타일
  errorMessageBubble: {
    backgroundColor: "#FFEBEE",
    borderColor: "#FFCDD2",
  },
  errorMessageText: {
    color: "#D32F2F",
  },

  // 로딩 표시 스타일
  loadingContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  loadingBubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  loadingIndicator: {
    marginRight: 10,
  },
  loadingText: {
    fontFamily: "Outfit",
    fontSize: 14,
    color: "#555",
  },

  // 이미지 스타일
  messageImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 5,
  },

  // 카테고리 스타일
  categoryContainer: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: 12,
    fontFamily: "Outfit",
    color: COLORS.primaryDark,
    fontWeight: "500",
  },

  // TTS 버튼 스타일
  ttsButton: {
    padding: 6,
    borderRadius: 15,
    backgroundColor: "#E3F2FD",
    marginLeft: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },

  // 메시지 내용 컨테이너 스타일
  messageContentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },

  // 이미지 컨테이너 스타일
  imageContainer: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 5,
  },

  // View More Details 버튼 스타일
  viewMoreButton: {
    padding: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderTopLeftRadius: 4, // 말풍선 모양을 위한 상단 왼쪽 모서리 변경
    backgroundColor: COLORS.white, // AI 메시지와 동일한 배경색
    marginLeft: 48, // 프로필 이미지 너비 + 간격과 동일하게 맞춤 (40px + 8px)
    marginTop: 8,
    marginBottom: 16,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#EEEEEE", // AI 메시지와 동일한 테두리 색상
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    // 말풍선과 동일한 스타일 적용
    maxWidth: "75%",
  },
  viewMoreText: {
    fontFamily: "Outfit",
    fontSize: 16,
    color: "#40ABE5", // 버튼임을 알 수 있도록 파란색 유지
  },

  // AI message wrapper (바깥쪽 컨테이너)
  botMessageWrapper: {
    flexDirection: "column",
    marginBottom: 16,
  },
});
