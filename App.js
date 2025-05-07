import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Main from "./screens/MainScreen"; // main page
import Emergency from "./screens/EmergencyScreen"; // emergency page
import PersonalContent from "./screens/PersonalContentScreen"; //personal content page
import Prepare from "./screens/PrepareScreen"; // prepare page
import MyPage from "./screens/MyPageScreen"; // my page
import Sidebar from "./screens/SidebarScreen"; // Sidebar (header, footer 제외)

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={Main} />
        <Stack.Screen name="Emergency" component={Emergency} />
        <Stack.Screen name="PersonalContent" component={PersonalContent} />
        <Stack.Screen name="PrepareTravels" component={Prepare} />
        <Stack.Screen name="MyPage" component={MyPage} />
        {/* Add other screens here */}
        <Stack.Screen name="Sidebar" component={Sidebar} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
