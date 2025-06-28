"use client"
import { useRouter } from 'expo-router';
import { useState, useContext } from "react"
import { View, Alert,TouchableOpacity, Text,StyleSheet  } from "react-native"
import { AuthContext } from "./context/authContext"
import { SafeAreaView } from 'react-native-safe-area-context';

import LoginScreen from "./login"
import SignupScreen from "./signup"
import AsyncStorage from "@react-native-async-storage/async-storage"
type Screen = "login" | "signup"


export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login")
  const { signIn } = useContext(AuthContext);
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
  console.log("Login attempt:", { email, password });
  try {
    const response = await fetch("http://localhost:8000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // only email & password here
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log("Login response:", data);

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    // store the token and update your AuthContext
    await signIn(data.token);  
    // or if you’re not using the context yet:
    // await AsyncStorage.setItem("userToken", data.token);

    // send them into the authenticated tab flow
    router.replace("/profile");
    
    } catch (err: any) {
      console.log("Login error:", err);
      Alert.alert("Error", err.message);
    }
  };

  const handleSignup = async (name: string, email: string, password: string) => {
    console.log("Signup attempt:", { name, email, password })
    try {
      //Send a signup request to the backend
      const response = await fetch("http://localhost:8000/signup", {
        method: "POST",
        headers: {"Content-Type": "application/json",},
        body: JSON.stringify({username:name, email, password}),
      })

      //await the response from the backend and log the response
      const data = await response.json()
      console.log(data)
    
      if(!response.ok) {
        throw new Error(data.message)
      }
      Alert.alert("Success", "Account created successfully!")
      setCurrentScreen("login")
    } catch (err:any) {
      console.log(err)
      Alert.alert("Error", err.message)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ——— Top segmented control ——— */}
      <View style={styles.tabRow}>
        {(["login","signup"] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              currentScreen === tab && styles.activeTab
            ]}
            onPress={() => setCurrentScreen(tab)}
          >
            <Text
              style={[
                styles.tabText,
                currentScreen === tab && styles.activeTabText
              ]}
            >
              {tab === "login" ? "Log in" : "Sign up"}
            </Text>
          </TouchableOpacity>
        ))}
        </View>

        {/* ——— Render the right form ——— */}
        {currentScreen === "login"
          ? <LoginScreen onNavigateToSignup={() => setCurrentScreen("signup")} onLogin={handleLogin} />
          : <SignupScreen onNavigateToLogin={() => setCurrentScreen("login")} onSignup={handleSignup} />
        }
      </SafeAreaView>
    );
  }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomColor: "#288afa",  // your brand color
    borderBottomWidth: 2,
  },
  tabText: {
    color: "#888",
    fontSize: 16,
  },
  activeTabText: {
    color: "#288afa",
    fontWeight: "600",
  },
});
// <LoginScreen onNavigateToSignup={() => setCurrentScreen("signup")} onLogin={handleLogin} />
// <SignupScreen onNavigateToLogin={() => setCurrentScreen("login")} onSignup={handleSignup} />