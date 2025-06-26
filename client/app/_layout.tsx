import { Stack } from "expo-router";
import { useContext } from "react";
import { AuthContext } from "./context/authContext";
import "./globals.css";


export default function RootLayout() {
  const { token } = useContext(AuthContext);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {token
        ? (
          // Once we have a token, jump straight into our (tabs) group
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        ) : (
          // Otherwise, let them go between login & signup
          <>
            <Stack.Screen name="index" />
            <Stack.Screen name="signup" />
          </>
        )
      }
    </Stack>
  );
}