import { Tabs } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#9810FA",
        tabBarInactiveTintColor: "#9AA0A6",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="luckyplaylist"
        options={{
          title: "Lucky Diary",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="pen" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen name="time" options={{ href: null }} />

      <Tabs.Screen
        name="color"
        options={{
          title: "Color",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="palette" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen name="cookie" options={{ href: null }} />

      <Tabs.Screen
        name="omamori"
        options={{
          title: "Omamori",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clover" color={color} size={size} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="breathing"
        options={{
          title: "Breathing",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="heart" color={color} size={size} />
          ),
        }}
      />

    </Tabs>
  );
}
