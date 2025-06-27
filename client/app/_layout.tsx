// app/_layout.tsx
"use client";

import React, { useContext, useEffect } from 'react';
import { Stack, router } from 'expo-router';
import AuthProvider, { AuthContext } from './context/authContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

function AuthGate() {
  const { token } = useContext(AuthContext);

  // 🚀 as soon as we know we have a token, go to dashboard
  useEffect(() => {
    if (token) {
      router.replace("/profile");
    }
  }, [token]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {token
        ? /* still include the group so /dashboard works */
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        : <>
            <Stack.Screen name="index" />
            <Stack.Screen name="signup" />
          </>
      }
    </Stack>
  );
}
