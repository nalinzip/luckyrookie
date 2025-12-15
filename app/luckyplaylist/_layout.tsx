// app/luckyplaylist/_layout.tsx
import React from "react";
import { Stack } from "expo-router";

export default function LuckyPlaylistLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Lucky Diary" }} />
      <Stack.Screen name="note" options={{ title: "Lucky Diary" }} />
      <Stack.Screen name="camera" options={{ title: "Camera" }} />
    </Stack>
  );
}
