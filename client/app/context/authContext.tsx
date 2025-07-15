// context/authContext.tsx
import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export type AuthContextType = {
  token: string | null;
  isLoading: boolean;
  signIn: (tok: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  token: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Pull token from storage once on mount
  useEffect(() => {
    AsyncStorage.getItem("userToken")
      .then(stored => {
        console.log("🔁 rehydrated token:", stored);
        if (stored) setToken(stored);
      })
      .catch(err => console.warn("Error rehydrating token", err))
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = async (tok: string) => {
    await AsyncStorage.setItem("userToken", tok);
    setToken(tok);
    // on fresh login, drop into onboarding
    router.replace("/onboarding/maxes");
  };

  const signOut = async () => {
    await AsyncStorage.removeItem("userToken");
    setToken(null);
    router.replace("/");
  };

  // let AuthGate handle loading UI
  return (
    <AuthContext.Provider value={{ token, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
