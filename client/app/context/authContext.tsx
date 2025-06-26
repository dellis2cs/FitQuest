import React, {createContext, useState, useEffect} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AuthContextType = {
    token: string | null;
    signIn: (tok: string) => Promise<void>;
    signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  token: null,
  signIn: async () => {},
  signOut: async () => {},
});

export default function AuthProvider({children}: {children: React.ReactNode}){
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        AsyncStorage.getItem('userToken').then(stored => setToken(stored)).finally(() => setLoading(false));
    }, []);

    const signIn = async (tok: string) => {
        await AsyncStorage.setItem('userToken', tok);
        setToken(tok);
    }

    const signOut = async () => {
        await AsyncStorage.removeItem('userToken');
        setToken(null);
    }

    if (loading) return null;

    return (
        <AuthContext.Provider value={{token, signIn, signOut}}>
            {children}
        </AuthContext.Provider>
    )
}