import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  useFonts,
  OriginalSurfer_400Regular,
} from "@expo-google-fonts/original-surfer";
import { Outfit_400Regular } from "@expo-google-fonts/outfit";
import Main from "./screens/MainScreen"; // main page
import Emergency from "./screens/EmergencyScreen"; // emergency page
import HistoryCulture from "./screens/HistoryCultureScreen"; // history/culture page
import Prepare from "./screens/PrepareScreen"; // prepare page
import MyPage from "./screens/MyPageScreen"; // my page
import Sidebar from "./screens/SidebarScreen"; // Sidebar (header, footer 제외)

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    OriginalSurfer: OriginalSurfer_400Regular,
    Outfit: Outfit_400Regular,
  });

  if (!fontsLoaded) {
    return null; // 폰트 로딩 중에는 아무것도 렌더링하지 않음
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={Main} />
        <Stack.Screen name="Emergency" component={Emergency} />
        <Stack.Screen name="History/Culture" component={HistoryCulture} />
        <Stack.Screen name="PrepareTravels" component={Prepare} />
        <Stack.Screen name="MyPage" component={MyPage} />
        {/* Add other screens here */}
        <Stack.Screen name="Sidebar" component={Sidebar} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
