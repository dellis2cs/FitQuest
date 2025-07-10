// app/_layout.tsx
"use client";

import React, { useContext, useEffect } from 'react';
import { Stack, router } from 'expo-router';
import * as Font from "expo-font";
import AppLoading from "expo-app-loading";
import AuthProvider, { AuthContext } from './context/authContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();
export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = React.useState(false);

  // 1️⃣ Kick off loading your Poppins files
  useEffect(() => {
    Font.loadAsync({
      "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
      "Poppins-Medium":  require("../assets/fonts/Poppins-Medium.ttf"),
      "Poppins-Bold":    require("../assets/fonts/Poppins-Bold.ttf"),
    }).then(() => setFontsLoaded(true));
  }, []);

  // 2️⃣ Block rendering until your fonts are ready
  if (!fontsLoaded) {
    return <AppLoading />;   // splashscreen auto‐hides when done
  }

  // 3️⃣ Once ready, initialize your app as before:
  return (
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
    </QueryClientProvider>
  );
}

function AuthGate() {
  const { token } = useContext(AuthContext);

  // 🚀 as soon as we know we have a token, go to dashboard
  useEffect(() => {
    if (token) {
      router.replace("/workouts");
    }
  }, [token]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {token ? (
        <>
          {/* your main tabs */}
          <Stack.Screen name="(tabs)" />

          {/* your standalone add-workout page */}
          <Stack.Screen
            name="add-workout"
            options={{
              // optional: present as a modal
              presentation: "modal",
              headerShown: false,
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="index" />
          <Stack.Screen name="signup" />
        </>
      )}
    </Stack>
  );
}