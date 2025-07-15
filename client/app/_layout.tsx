// app/_layout.tsx
"use client";

import React, { useContext, useEffect } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
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
  const pathname = usePathname();
  const router = useRouter();

  // 🚀 as soon as we know we have a token, go to dashboard
  useEffect(() => {
    if (token) {
      const checkOnboarding = async () => {
        try {
          const res = await fetch('http://localhost:8000/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (!res.ok) throw new Error('Profile fetch failed');
          
          const profile = await res.json();
          
          // Check if any max is missing or zero
          const needsOnboarding = [
            'bench_1rm', 
            'squat_1rm', 
            'deadlift_1rm'
          ].some(key => !profile[key] || profile[key] <= 0);

          // Only redirect once when first loading
          if (!pathname.startsWith('/onboarding') && needsOnboarding) {
            router.replace('/onboarding/maxes');
          } else if (pathname === '/onboarding/maxes' && !needsOnboarding) {
            router.replace('/workouts');
          }
        } catch (error) {
          console.error('Onboarding check failed:', error);
        }
      };

      checkOnboarding();
    }
  }, [token, pathname, router]);

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
          <Stack.Screen name="onboarding/maxes" />
        </>
      )}
    </Stack>
  );
}