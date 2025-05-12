import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Keyboard,
} from "react-native";
import Frame from "../Frame";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useChat } from "../context/ChatContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from "expo-speech";

const Sidebar = ({ navigation }) => {
  // Login state management
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { resetChat } = useChat();

  // Check token on component mount
  useEffect(() => {
    checkLoginStatus();
  }, []);

  // Check login status function
  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      setIsLoggedIn(!!token); // Set logged in if token exists
    } catch (error) {
      console.error('Error checking token:', error);
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('access_token');
      setIsLoggedIn(false);

      // Reset chat on logout
      resetChat();

      // Stop TTS if running
      if (Speech && Speech.stop) {
        Speech.stop();
      }

      Alert.alert('Notice', 'You have been logged out.');

      // Navigate to main screen
      setTimeout(() => {
        navigation.navigate("Main");
      }, 50);
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'There was a problem during logout.');
    }
  };

  // Function to dismiss keyboard when navigating
  const navigateAndDismissKeyboard = (screenName) => {
    Keyboard.dismiss(); // Dismiss keyboard

    // Navigate after keyboard is dismissed
    setTimeout(() => {
      navigation.navigate(screenName);
    }, 50); // 50ms delay
  };

  // Simple navigation function (no chat reset)
  const handleNavigateToMain = () => {
    Keyboard.dismiss(); // Dismiss keyboard

    // Navigate after keyboard is dismissed
    setTimeout(() => {
      navigation.navigate("Main");
    }, 50); // 50ms delay
  };

  // Navigation function with chat reset
  const handleResetChatAndNavigate = () => {
    Keyboard.dismiss(); // Dismiss keyboard

    // Reset chat - also creates new session
    resetChat();

    // Stop TTS if running
    if (Speech && Speech.stop) {
      Speech.stop();
    }

    // Navigate after keyboard is dismissed
    setTimeout(() => {
      navigation.navigate("Main");

      // New chat alert
      setTimeout(() => {
        Alert.alert(
          "New Chat",
          "Starting a new chat session.",
          [{ text: "OK" }],
          { cancelable: true }
        );
      }, 300);
    }, 50); // 50ms delay
  };

  // User info component to display after login
  const renderUserInfo = () => {
    if (!isLoggedIn) return null;

    return (
      <View style={styles.userInfoContainer}>
        <View style={styles.profileImagePlaceholder}>
          <Image
            source={require('../assets/figma_images/trabuddy_face.png')}
            style={styles.profileImage}
          />
        </View>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Login button (only shown when not logged in)
  const renderLoginButton = () => {
    if (isLoggedIn) return null;

    return (
      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => navigation.navigate("Login")}
      >
        <LinearGradient
          colors={['#40ABE5', '#528099']}
          style={styles.loginGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.loginText}>Login / Sign Up</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <Frame AppName="" disableBackground={true} style={styles.container}>
      {/* User info (only displayed when logged in) */}
      {renderUserInfo()}

      {/* Menu items */}
      <View style={styles.menuContainer}>
        <View style={styles.chatMenuItem}>
          <TouchableOpacity
            onPress={handleNavigateToMain}
            style={styles.chatMenuTextWrapper}
          >
            <Text style={styles.link}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleResetChatAndNavigate}
            style={styles.chatIconWrapper}
          >
            <MaterialCommunityIcons
              name="chat-plus-outline"
              size={40}
              color="black"
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigateAndDismissKeyboard("HistoryCulture")}
          style={styles.menuItem}
        >
          <Text style={styles.link}>History/Culture</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateAndDismissKeyboard("PersonalContent")}
          style={styles.menuItem}
        >
          <Text style={styles.link}>PersonalContent</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateAndDismissKeyboard("PrepareTravels")}
          style={styles.menuItem}
        >
          <Text style={styles.link}>Prepare Travels</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateAndDismissKeyboard("Emergency")}
          style={styles.menuItem}
        >
          <Text style={styles.link}>Emergency</Text>
        </TouchableOpacity>

        {isLoggedIn && (
          <TouchableOpacity
            onPress={() => navigateAndDismissKeyboard("PreviousChat")}
            style={styles.menuItem}
          >
            <Text style={styles.link}>Previous Chat</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Login button (placed at bottom of screen) */}
      <View style={styles.loginButtonContainer}>
        {renderLoginButton()}
      </View>
    </Frame>
  );
};

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    backgroundColor: "#fff",
  },
  userInfoContainer: {
    alignItems: "center",
    padding: 20,
    marginTop: 30,
    marginBottom: 20,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#40ABE5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    overflow: 'hidden',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  logoutButton: {
    backgroundColor: "#EEF7FB",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 5,
  },
  logoutText: {
    color: "#40ABE5",
    fontFamily: "Outfit",
    fontSize: 16,
  },
  menuContainer: {
    flex: 1,
    marginTop: 20,
  },
  loginButtonContainer: {
    alignItems: 'flex-end',
    paddingRight: 20,
    paddingBottom: 30,
  },
  loginButton: {
    width: 180,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
  },
  loginGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  loginText: {
    color: "white",
    fontFamily: "OriginalSurfer",
    fontSize: 18,
  },
  chatMenuItem: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 30,
    marginBottom: 15,
  },
  chatMenuTextWrapper: {
    paddingVertical: 10,
  },
  chatIconWrapper: {
    padding: 5,
  },
  menuItem: {
    paddingVertical: 10,
    marginBottom: 15,
  },
  link: {
    fontFamily: "OriginalSurfer",
    fontSize: 26,
    color: "black",
    paddingLeft: 30,
    textShadowColor: "#89D6FF",
    textShadowOffset: { width: 0, height: 4 },
    textShadowOpacity: 1,
    textShadowRadius: 4,
    elevation: 5,
  },
  icon: {
    paddingRight: 5,
  },
});

export default Sidebar;
