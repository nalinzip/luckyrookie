// app/_layout.tsx
import { Tabs } from "expo-router";

export default function RootLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen
        name="luckyplaylist"
        options={{
          title: "Lucky Diary",
          headerShown: false,  
        }}
      />
      <Tabs.Screen name="time" options={{ href: null }} />
      <Tabs.Screen name="color" options={{ title: "Color" }} />
      <Tabs.Screen name="cookie" options={{ href: null }} />
      <Tabs.Screen name="omamori" options={{ title: "Omamori" }} />
      <Tabs.Screen name="siemsi" options={{ href: null }} />
    </Tabs>
  );
}