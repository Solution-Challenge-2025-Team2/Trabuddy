import { View, StyleSheet, ImageBackground, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";

// header와 footer를 포함한 모바일 틀
export default function Frame({
  AppName = "Trabuddy",
  children,
  disableBackground = false,
}) {
  const route = useRoute();
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 20}
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
