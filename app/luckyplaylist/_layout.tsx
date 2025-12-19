// app/luckyplaylist/_layout.tsx
import React from "react";
import { Stack } from "expo-router";

export default function LuckyPlaylistLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="note" />
      <Stack.Screen name="camera" />
    </Stack>
  );
}
