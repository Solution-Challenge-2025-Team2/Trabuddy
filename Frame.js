import { View, StyleSheet, ImageBackground } from "react-native";
import Header from "./components/Header";
import Footer from "./components/Footer";

// header와 footer를 포함한 모바일 틀
export default function Frame({ children }) {
  return (
    <ImageBackground
      source={require("./assets/background-img.png")}
      style={styles.container}
    >
      <Header />
      <View style={styles.content}>{children}</View>
      <Footer />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    resizeMode: "cover",
  },
  content: {
    flex: 5,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
