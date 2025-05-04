import { View, StyleSheet, ImageBackground, ScrollView } from "react-native";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { SafeAreaView } from "react-native-safe-area-context";

// header와 footer를 포함한 모바일 틀
export default function Frame({ children }) {
  return (
    <ImageBackground
      source={require("./assets/background-img.png")}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View>
          <Header />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {children}
        </ScrollView>

        <View>
          <Footer />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});
