import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const WEEKDAYS = [
  { key: "mon", label: "Monday", shortName: "Mon", color: "#FFE6A7" },
  { key: "tue", label: "Tuesday", shortName: "Tue", color: "#FFD1DC" },
  { key: "wed", label: "Wednesday", shortName: "Wed", color: "#D5F5E3" },
  { key: "thu", label: "Thursday", shortName: "Thu", color: "#FFE4C4" },
  { key: "fri", label: "Friday", shortName: "Fri", color: "#C7E5FF" },
  { key: "sat", label: "Saturday", shortName: "Sat", color: "#E3C6FF" },
  { key: "sun", label: "Sunday", shortName: "Sun", color: "#FFCCB3" },
];

type DayColorConfig = {
  work: string[];
  finance: string[];
  love: string[];
  health: string[];
  unlucky: string[];
};

// Lucky color sets for each day based on the provided table
const DAY_COLOR_CONFIG: Record<string, DayColorConfig> = {
  sun: { // Sunday - Red row
    work: ["#FF0000", "#FF8C00", "#FFB6C1"], // Red, Orange, Pink
    finance: ["#9370DB", "#FF8C00", "#90EE90"], // Purple, Orange, Green
    love: ["#000000", "#808080", "#90EE90"], // Black, Gray, Green
    health: ["#FFFFFF", "#FFFF00"], // White, Yellow
    unlucky: ["#87CEEB", "#0000FF"], // Light Blue, Blue
  },
  mon: { // Monday - Yellow row
    work: ["#FFFF00", "#87CEEB", "#90EE90"], // Yellow, Light Blue, Green
    finance: ["#9370DB", "#87CEEB", "#0000FF"], // Purple, Light Blue, Blue
    love: ["#FFB6C1", "#9370DB", "#0000FF"], // Pink, Purple, Blue
    health: ["#9370DB", "#FFB6C1", "#87CEEB"], // Purple, Pink, Light Blue
    unlucky: ["#FF0000", "#FF8C00"], // Red, Orange
  },
  tue: { // Tuesday - Pink row
    work: ["#9370DB", "#000000", "#FF8C00"], // Purple, Black, Orange
    finance: ["#FFFF00", "#FF8C00", "#F0E68C"], // Yellow, Orange, Light Yellow
    love: ["#FF0000", "#FF8C00"], // Red, Orange
    health: ["#87CEEB", "#FFB6C1"], // Light Blue, Pink
    unlucky: ["#FFFFFF"], // White
  },
  wed: { // Wednesday - Green row
    work: ["#FFFF00", "#FF8C00", "#90EE90"], // Yellow, Orange, Green
    finance: ["#000000", "#808080", "#8B4513"], // Black, Gray, Brown
    love: ["#000000", "#F5DEB3"], // Black, Beige
    health: ["#9370DB", "#0000FF"], // Purple, Blue
    unlucky: ["#FF0000", "#FFB6C1"], // Red, Pink
  },
  thu: { // Thursday - Orange row
    work: ["#0000FF", "#FF0000", "#90EE90"], // Blue, Red, Green
    finance: ["#FF8C00", "#F5DEB3", "#FFB6C1"], // Orange, Beige, Pink
    love: ["#87CEEB", "#FF8C00", "#FF0000"], // Light Blue, Orange, Red
    health: ["#0000FF", "#808080"], // Blue, Gray
    unlucky: ["#9370DB"], // Purple
  },
  fri: { // Friday - Light Blue row
    work: ["#87CEEB", "#FFFF00", "#F5DEB3"], // Light Blue, Yellow, Beige
    finance: ["#FFFF00", "#FFB6C1"], // Yellow, Pink
    love: ["#FFFF00", "#FFB6C1", "#9370DB"], // Yellow, Pink, Purple
    health: ["#FF0000"], // Red
    unlucky: ["#808080"], // Gray
  },
  sat: { // Saturday - Purple row
    work: ["#0000FF", "#808080", "#000000"], // Blue, Gray, Black
    finance: ["#87CEEB", "#0000FF", "#9370DB"], // Light Blue, Blue, Purple
    love: ["#87CEEB", "#FFB6C1", "#FF0000"], // Light Blue, Pink, Red
    health: ["#F5DEB3", "#FF8C00"], // Beige, Orange
    unlucky: ["#FFFFFF", "#FFFF00"], // White, Yellow
  },
};

const jsDayToKey = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export default function LuckyColorChartScreen() {
  const today = new Date();
  const defaultDayKey = jsDayToKey[today.getDay()];
  const [selectedDay, setSelectedDay] = useState<string>(defaultDayKey);

  const currentDay = WEEKDAYS.find((d) => d.key === selectedDay);
  const currentColors = DAY_COLOR_CONFIG[selectedDay];

  return (
    <LinearGradient
      colors={['#EEF7F1', '#F3F0FF']}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Lucky Color Chart</Text>
          <Text style={styles.subtitle}>2025 Daily Lucky Colors</Text>
        </View>

        {/* Selected Day Badge */}
        <View style={styles.selectedDayBadge}>
          <View style={[styles.selectedDayColor, { backgroundColor: currentDay?.color }]} />
          <View style={styles.selectedDayText}>
            <Text style={styles.selectedDayLabel}>Selected Day</Text>
            <Text style={styles.selectedDayName}>{currentDay?.label}</Text>
          </View>
        </View>

        {/* Weekday Selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Day</Text>
          <View style={styles.weekdayGrid}>
            {WEEKDAYS.map((d) => {
              const isSelected = d.key === selectedDay;
              return (
                <TouchableOpacity
                  key={d.key}
                  style={[
                    styles.dayChip,
                    { backgroundColor: d.color },
                    isSelected && styles.dayChipSelected,
                  ]}
                  onPress={() => setSelectedDay(d.key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dayChipLabel}>{d.shortName}</Text>
                  <Text style={styles.dayChipFull}>{d.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Work Colors */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Work & Study</Text>
          </View>
          <Text style={styles.cardSubtitle}>Good colors for career and work</Text>
          <View style={styles.colorGrid}>
            {currentColors.work.map((c, idx) => (
              <View key={`${c}-${idx}`} style={styles.colorItem}>
                <View style={[styles.colorCircle, { backgroundColor: c }]} />
                <View style={styles.colorSwatchSmall}>
                  <View style={[styles.colorSwatchInner, { backgroundColor: c }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Finance Colors */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Money & Wealth</Text>
          </View>
          <Text style={styles.cardSubtitle}>Good colors for finance and prosperity</Text>
          <View style={styles.colorGrid}>
            {currentColors.finance.map((c, idx) => (
              <View key={`${c}-${idx}`} style={styles.colorItem}>
                <View style={[styles.colorCircle, { backgroundColor: c }]} />
                <View style={styles.colorSwatchSmall}>
                  <View style={[styles.colorSwatchInner, { backgroundColor: c }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Love Colors */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Love</Text>
          </View>
          <Text style={styles.cardSubtitle}>Good colors for love and relationships</Text>
          <View style={styles.colorGrid}>
            {currentColors.love.map((c, idx) => (
              <View key={`${c}-${idx}`} style={styles.colorItem}>
                <View style={[styles.colorCircle, { backgroundColor: c }]} />
                <View style={styles.colorSwatchSmall}>
                  <View style={[styles.colorSwatchInner, { backgroundColor: c }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Health Colors */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Health & Vitality</Text>
          </View>
          <Text style={styles.cardSubtitle}>Good colors for health and energy</Text>
          <View style={styles.colorGrid}>
            {currentColors.health.map((c, idx) => (
              <View key={`${c}-${idx}`} style={styles.colorItem}>
                <View style={[styles.colorCircle, { backgroundColor: c }]} />
                <View style={styles.colorSwatchSmall}>
                  <View style={[styles.colorSwatchInner, { backgroundColor: c }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Unlucky Colors */}
        <View style={[styles.card, styles.avoidCard]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, styles.iconCircleAvoid]}>
              <Text style={styles.iconText}>✕</Text>
            </View>
            <Text style={[styles.cardTitle, styles.avoidTitle]}>Unlucky Colors</Text>
          </View>
          <Text style={styles.cardSubtitle}>Colors to avoid</Text>
          <View style={styles.colorGrid}>
            {currentColors.unlucky.map((c, idx) => (
              <View key={`${c}-${idx}`} style={styles.colorItem}>
                <View style={[styles.colorCircle, { backgroundColor: c }]} />
                <View style={styles.colorSwatchSmall}>
                  <View style={[styles.colorSwatchInner, { backgroundColor: c }]} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#222222",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  selectedDayBadge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedDayColor: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedDayText: {
    flex: 1,
  },
  selectedDayLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  selectedDayName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#222222",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avoidCard: {
    backgroundColor: "#FFF8F8",
    borderColor: "#FFD1D1",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircleAvoid: {
    backgroundColor: "#FFEBEE",
  },
  iconText: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222222",
  },
  avoidTitle: {
    color: "#D32F2F",
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
    marginBottom: 16,
  },
  weekdayGrid: {
    marginTop: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  dayChip: {
    width: 90,
    height: 90,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  dayChipSelected: {
    borderColor: "#222222",
    transform: [{ scale: 1.05 }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  dayChipLabel: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 2,
  },
  dayChipFull: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
  },
  colorGrid: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  colorItem: {
    alignItems: "center",
    gap: 8,
  },
  colorCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  colorSwatchSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  colorSwatchInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});