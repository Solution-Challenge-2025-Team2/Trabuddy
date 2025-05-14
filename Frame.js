import {
  View,
  StyleSheet,
  ImageBackground,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { useChat } from "./context/ChatContext";

// header와 footer를 포함한 모바일 틀
export default function Frame({
  AppName = "Trabuddy",
  children,
  disableBackground = false,
}) {
  const route = useRoute();
  const navigation = useNavigation();
  const { pendingNavigation, setPendingNavigation } = useChat();
  const [keyboardDuration, setKeyboardDuration] = useState(250); // 기본 키보드 애니메이션 시간

  // 키보드 애니메이션 속도 감지
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        // 키보드 애니메이션 시간 설정 (iOS만 제공)
        if (Platform.OS === "ios" && e.duration) {
          setKeyboardDuration(e.duration);
        }
      }
    );

    return () => {
      keyboardWillShowListener.remove();
    };
  }, []);

  // 보류 중인 내비게이션 처리
  useEffect(() => {
    const handlePendingNavigation = async () => {
      if (pendingNavigation) {
        console.log('보류 중인 내비게이션 감지:', pendingNavigation.screen);

        // 현재 화면이 목적지 화면과 동일한지 확인 (중복 이동 방지)
        if (route.name !== pendingNavigation.screen) {
          // 다른 화면일 경우에만 이동
          try {
            // 잠시 지연 후 이동 (UI 업데이트 완료 대기)
            setTimeout(() => {
              navigation.navigate(pendingNavigation.screen, pendingNavigation.params);
              console.log('자동 내비게이션 실행:', pendingNavigation.screen);
            }, 100);
          } catch (error) {
            console.error('자동 내비게이션 실행 오류:', error);
          }
        } else {
          console.log('이미 목적지 화면에 있어 내비게이션 생략:', route.name);
        }

        // 내비게이션 처리 후 상태 초기화
        setPendingNavigation(null);
      }
    };

    handlePendingNavigation();
  }, [pendingNavigation, navigation, route.name, setPendingNavigation]);

  const Wrapper = disableBackground ? View : ImageBackground;
  const wrapperProps = disableBackground
    ? { style: styles.container }
    : {
      source: require("./assets/background-img.png"),
      style: styles.container,
    };
  return (
    <SafeAreaView style={styles.safeArea}>
      <Wrapper {...wrapperProps}>
        <View>
          <Header AppName={AppName} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
          contentContainerStyle={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          enableAutomaticScroll={true}
          // 키보드 애니메이션 속도와 동기화
          enableOnAndroid={true}
          // iOS에서 애니메이션 속도 동기화
          iosTransitionConfig={{
            timing: { duration: keyboardDuration },
          }}
        >
          <ScrollView contentContainerStyle={styles.content}>
            {children}
          </ScrollView>

          {/* Sidebar가 아닐 때만 footer 랜더링 */}
          {route.name !== "Sidebar" && (
            <View style={styles.footerContainer}>
              <Footer />
            </View>
          )}
        </KeyboardAvoidingView>
      </Wrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    resizeMode: "cover",
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 5,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  footerContainer: {
    backgroundColor: "white",
  },
});
