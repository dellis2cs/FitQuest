"use client"
import { useRouter } from 'expo-router';
import { useState, useContext } from "react"
import { View, Alert } from "react-native"
import { AuthContext } from "./context/authContext"

import LoginScreen from "./login"
import SignupScreen from "./signup"
import AsyncStorage from "@react-native-async-storage/async-storage"
type Screen = "login" | "signup"


export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("signup")
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
    router.replace("/dashboard");
    
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
      await AsyncStorage.setItem("userToken", data.token)
      Alert.alert("Success", "Account created successfully!")
      setCurrentScreen("login")
    } catch (err:any) {
      console.log(err)
      Alert.alert("Error", err.message)
    }
  }

  return (
    <View style={{ flex: 1 }}>
      {currentScreen === "login" ? (
        <LoginScreen onNavigateToSignup={() => setCurrentScreen("signup")} onLogin={handleLogin} />
      ) : (
        <SignupScreen onNavigateToLogin={() => setCurrentScreen("login")} onSignup={handleSignup} />
      )}
    </View>
  )
}
