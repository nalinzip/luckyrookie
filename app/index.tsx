import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function Home() {
  return (
    <LinearGradient
      colors={['#EEF7F1', '#F3F0FF']}
      style={styles.gradient}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <Image
            source={require("./four-leaf-clover-st-patricks-day-cartoon-sticker-ufdf3-x450.png")}
            style={styles.image}
            resizeMode="contain"
          />
          <Text style={styles.title}>LuckyRookie</Text>
          <Text style={styles.tagline}>Discover your luck, everyday</Text>
        </View>

        {/* Feature Cards */}
        <View style={styles.cardsContainer}>
          <FeatureCard
            emoji="⏰"
            title="Lucky Time"
            description="Find your personal lucky hours based on numerology and golden hour timings"
            gradient={['#66C07A', '#4CAF50']}
            onPress={() => router.push("/time")}
          />
          
          <FeatureCard
            emoji="🥠"
            title="Fortune Cookie"
            description="Koisuru Fortune Cookie... Get your daily horoscope reading and discover what the stars have in store"
            gradient={['#66C07A', '#4CAF50']}
            onPress={() => router.push("/cookie")}
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function FeatureCard({ 
  emoji,
  title, 
  description,
  gradient,
  onPress 
}: { 
  emoji: string;
  title: string; 
  description: string;
  gradient: readonly [string, string];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress} 
      activeOpacity={0.85}
    >
      <View style={styles.cardContent}>
        <View style={styles.emojiCircle}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emojiGradient}
          >
            <Text style={styles.cardEmoji}>{emoji}</Text>
          </LinearGradient>
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
        <Text style={styles.cardArrow}>→</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    paddingBottom: 60,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 20,
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#222222",
    textAlign: "center",
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    fontWeight: "400",
    color: "#555",
    fontStyle: "italic",
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  emojiCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
  },
  emojiGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  cardEmoji: {
    fontSize: 28,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: "400",
    color: "#666666",
    lineHeight: 20,
  },
  cardArrow: {
    fontSize: 24,
    color: "#999999",
  },
});