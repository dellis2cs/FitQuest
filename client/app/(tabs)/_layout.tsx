import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout(){
    return (
        <Tabs
      screenOptions={{
        headerShown: false,        // no top header
        tabBarShowLabel: false,    // hide all labels
        tabBarActiveTintColor: '#485c11',   // your primary purple
        tabBarInactiveTintColor: '#A8AAA2',     // muted gray
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,       // remove border
          elevation: 0,            // remove Android shadow
          height: 70,              // adjust bar height
        },
      }}
    >
            <Tabs.Screen
        name="workouts"
        options={{
          title: "Workouts",
          headerShown: false,
          tabBarIcon: ({ color, size }) =>
            <Ionicons name="barbell" size={size} color={color} />,
        }}
      />
        <Tabs.Screen
            name="guilds"
            options={{
            title: "Guilds",
            headerShown: false,
            tabBarIcon: ({ color, size }) =>
                <Ionicons name="people" size={size} color={color} />,
            }}
        />
        <Tabs.Screen
            name="friends"
            options={{
            title: "Friends",
            headerShown: false,
            tabBarIcon: ({ color, size }) =>
                <Ionicons name="people-circle" size={size} color={color} />,
            }}
        />
        <Tabs.Screen
            name="profile"
            options={{
            title: "Profile",
            headerShown: false,
            tabBarIcon: ({ color, size }) =>
                <Ionicons name="person" size={size} color={color} />,
            }}
        />
        </Tabs>
    )
}