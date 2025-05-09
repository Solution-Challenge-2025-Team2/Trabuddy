import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  useFonts,
  OriginalSurfer_400Regular,
} from "@expo-google-fonts/original-surfer";
import { Outfit_400Regular } from "@expo-google-fonts/outfit";
import Main from "./screens/MainScreen"; // main page
import Emergency from "./screens/EmergencyScreen"; // emergency page
import PersonalContent from "./screens/PersonalContentScreen"; //personal content page
import Prepare from "./screens/PrepareScreen"; // prepare page
import PreviousChat from "./screens/PreviousChatScreen"; // previous chat page
import Sidebar from "./screens/SidebarScreen"; // Sidebar (header, footer 제외)
import HistoryCulture from "./screens/HistoryCultureScreen"; // 추가: History/Culture 페이지
import Login from "./screens/LoginScreen"; // 추가: 로그인 페이지
import { ChatProvider } from "./context/ChatContext"; // 추가: 채팅 컨텍스트
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    OriginalSurfer: OriginalSurfer_400Regular,
    Outfit: Outfit_400Regular,
  });

  // 로그인 상태 확인
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // AsyncStorage에서 토큰 확인
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        setIsLoggedIn(!!token);
      } catch (error) {
        console.error('토큰 확인 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  if (!fontsLoaded || isLoading) {
    return null; // 폰트와 로그인 상태 로딩 중에는 아무것도 렌더링하지 않음
  }

  return (
    <ChatProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={Main} />
          <Stack.Screen name="Emergency" component={Emergency} />
          <Stack.Screen name="PersonalContent" component={PersonalContent} />
          <Stack.Screen name="PrepareTravels" component={Prepare} />
          <Stack.Screen name="PreviousChat" component={PreviousChat} />
          {/* Add other screens here */}
          <Stack.Screen name="Sidebar" component={Sidebar} />
          <Stack.Screen name="HistoryCulture" component={HistoryCulture} />
          <Stack.Screen name="Login" component={Login} />
        </Stack.Navigator>
      </NavigationContainer>
    </ChatProvider>
  );
}
