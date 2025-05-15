import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  useFonts,
  OriginalSurfer_400Regular,
} from "@expo-google-fonts/original-surfer";
import { Outfit_400Regular } from "@expo-google-fonts/outfit";
import Main from "./screens/MainScreen"; // main page
import Problem from "./screens/ProblemScreen"; // Problem page
import PersonalContent from "./screens/PersonalContentScreen"; //personal content page
import Prepare from "./screens/PrepareScreen"; // prepare page
import PreviousChat from "./screens/PreviousChatScreen"; // previous chat page
import Sidebar from "./screens/SidebarScreen"; // Sidebar (header, footer 제외)
import HistoryDetail from "./screens/HistoryDetailScreen"; // 추가: History/Culture 페이지
import Login from "./screens/LoginScreen"; // 추가: 로그인 페이지
import OnboardingScreen from "./screens/OnboardingScreen"; // 추가: 온보딩 화면
import SplashScreen from "./screens/SplashScreen"; // 추가: 스플래시 화면
import AppStartupScreen from "./screens/AppStartupScreen"; // 추가: 앱 시작 화면
import { ChatProvider } from "./context/ChatContext"; // 추가: 채팅 컨텍스트
import AsyncStorage from "@react-native-async-storage/async-storage";

// 개발용 네트워크 모니터링 설정
if (__DEV__) {
  // 기존 console.log 저장
  const originalConsoleLog = console.log;

  // 콘솔 로그를 더 눈에 띄게 만듭니다
  console.log = (...args) => {
    const newArgs = args.map((arg) => {
      if (typeof arg === "string" && arg.includes("API")) {
        return `\n🔍 ${arg} 🔍\n`;
      }
      return arg;
    });
    originalConsoleLog(...newArgs);
  };

  // 네트워크 요청을 추적하는 코드
  global._fetch = fetch;
  global.fetch = (...args) => {
    const url = args[0].toString();
    // symbolicate 및 내부 개발 요청은 로그에 출력하지 않음
    if (
      !url.includes("symbolicate") &&
      !url.includes("localhost") &&
      !url.includes("127.0.0.1")
    ) {
      console.log(`\n📡 Fetch Request: ${url}\n`);
    }
    return global._fetch(...args);
  };
}

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    OriginalSurfer: OriginalSurfer_400Regular,
    Outfit: Outfit_400Regular,
  });

  // 로딩 상태만 확인 (다른 상태는 스크린에서 처리)
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 폰트 로딩만 확인
    if (fontsLoaded) {
      setIsLoading(false);
    }
  }, [fontsLoaded]);

  if (isLoading) {
    return null; // 폰트 로딩 중에는 아무것도 렌더링하지 않음
  }

  return (
    <ChatProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* 앱이 시작될 때마다 항상 스플래시 화면부터 시작 */}
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="AppStartup" component={AppStartupScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Main" component={Main} />
          <Stack.Screen name="Problem" component={Problem} />
          <Stack.Screen name="PersonalContent" component={PersonalContent} />
          <Stack.Screen name="PrepareTravels" component={Prepare} />
          <Stack.Screen name="PreviousChat" component={PreviousChat} />
          <Stack.Screen name="Sidebar" component={Sidebar} />
          <Stack.Screen name="HistoryDetail" component={HistoryDetail} />
          <Stack.Screen name="Login" component={Login} />
          {/* Add other screens here */}
        </Stack.Navigator>
      </NavigationContainer>
    </ChatProvider>
  );
}
