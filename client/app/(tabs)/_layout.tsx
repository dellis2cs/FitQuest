import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout(){
    return (
        <Tabs>
            <Tabs.Screen
                name="dashboard"
                options={{
                title: 'Home',
                tabBarIcon: ({ color, size }: any) =>
                    <Ionicons name="home" size={size} color={color} />,
                }}
            />
            {/* add more tabs here as needed */}
        </Tabs>
    )
}