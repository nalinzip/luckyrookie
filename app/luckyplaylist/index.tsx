// app/luckyplaylist.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Calendar } from "react-native-calendars";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CLOVER_KEY = "lucky-rookie-clovers";

async function getClovers(): Promise<number> {
  try {
    const value = await AsyncStorage.getItem(CLOVER_KEY);
    return value ? parseInt(value, 10) : 0;
  } catch (e) {
    return 0;
  }
}

export default function LuckyPlaylist() {
  const today = new Date();
  const [clovers, setClovers] = useState(0);

  function toDateString(d: Date) {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  const [selectedDate, setSelectedDate] = useState(toDateString(today));
  const todayString = toDateString(today);

  useEffect(() => {
    loadClovers();
    const interval = setInterval(loadClovers, 1000);
    return () => clearInterval(interval);
  }, []);

  async function loadClovers() {
    const count = await getClovers();
    setClovers(count);
  }

  const goToToday = () => {
    setSelectedDate(todayString);
  };

  return (
    <LinearGradient
      colors={['#EEF7F1', '#F3F0FF']}
      style={styles.gradient}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitle}>완벽한 날씨, 딱 맞는 playlist</Text>
            <Text style={styles.subtitle}>오늘의 selfie, I say, "I'm lucky"</Text>
          </View>
        </View>

        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeLabel}>Selected Date</Text>
          <Text style={styles.dateBadgeText}>{selectedDate}</Text>
        </View>

        <View style={styles.calendarCard}>
          <Calendar
            onDayPress={(day) => {
              setSelectedDate(day.dateString);
              router.navigate({
                pathname: "/luckyplaylist/note",
                params: { date: day.dateString },
              });
            }}
            markedDates={{ 
              [selectedDate]: { 
                selected: true, 
                marked: true,
                selectedColor: "#9810FA",
                selectedTextColor: "#FFFFFF",
              },
              [todayString]: {
                marked: true,
                dotColor: "#66C07A",
              }
            }}
            theme={{
              backgroundColor: '#FFFFFF',
              calendarBackground: '#FFFFFF',
              selectedDayBackgroundColor: '#9810FA',
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: '#66C07A',
              dayTextColor: '#222222',
              textDisabledColor: '#CCCCCC',
              monthTextColor: '#222222',
              textMonthFontWeight: '800',
              textDayFontWeight: '500',
              textMonthFontSize: 20,
              textDayHeaderFontSize: 13,
              textDayHeaderFontWeight: '600',
              arrowColor: '#66C07A',
              dotColor: '#66C07A',
              selectedDotColor: '#FFFFFF',
            }}
            style={styles.calendar}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.todayButtonWhite} 
            onPress={goToToday}
            activeOpacity={0.8}
          >
            <Text style={styles.todayButtonWhiteText}>Go to Today</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.writeButton} 
            onPress={() => {
              router.navigate({
                pathname: "/luckyplaylist/note",
                params: { date: selectedDate },
              });
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#9810FA', '#7B00E0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.writeButtonGradient}
            >
              <Text style={styles.writeButtonText}>Write Diary</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.cloverCard}>
          <Text style={styles.cloverIcon}>🍀</Text>
          <View style={styles.cloverTextContainer}>
            <Text style={styles.cloverLabel}>Total Clovers</Text>
            <Text style={styles.cloverCount}>{clovers}</Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#222222",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  subtitleContainer: {
    alignItems: "center",
    gap: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
    fontStyle: "italic",
  },
  dateBadge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateBadgeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  dateBadgeText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#9810FA",
    letterSpacing: 1,
  },
  calendarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  calendar: {
    borderRadius: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  todayButtonWhite: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 40,
    paddingVertical: 16,
    alignItems: "center",
  },
  todayButtonWhiteText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "700",
  },
  writeButton: {
    flex: 1,
    borderRadius: 40,
    overflow: "hidden",
    shadowColor: "#9810FA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  writeButtonGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  writeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  cloverCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  cloverIcon: {
    fontSize: 40,
  },
  cloverTextContainer: {
    alignItems: "center",
  },
  cloverLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  cloverCount: {
    fontSize: 32,
    fontWeight: "900",
    color: "#66C07A",
  },
  infoCard: {
    backgroundColor: "#F8F4FF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E8D9FF",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    lineHeight: 20,
    textAlign: "center",
  },
});