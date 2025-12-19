import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Phase = "inhale" | "hold" | "exhale" | "rest";

const BREATHING_PATTERNS = {
  "4-7-8": {
    name: "4-7-8 Relaxing",
    inhale: 4,
    hold: 7,
    exhale: 8,
    rest: 0,
  },
  "box": {
    name: "Box Breathing",
    inhale: 4,
    hold: 4,
    exhale: 4,
    rest: 4,
  },
  "simple": {
    name: "Simple Breathing",
    inhale: 4,
    hold: 0,
    exhale: 6,
    rest: 0,
  },
};

function getTodayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const BREATHING_KEY_PREFIX = "breathing-cycles-";

async function getBreathingCycles(date: string): Promise<{ cycles: number; pattern: string; lastSession: string | null }> {
  try {
    const value = await AsyncStorage.getItem(BREATHING_KEY_PREFIX + date);
    if (value) {
      return JSON.parse(value);
    }
    return { cycles: 0, pattern: "", lastSession: null };
  } catch (e) {
    return { cycles: 0, pattern: "", lastSession: null };
  }
}

async function saveBreathingCycles(date: string, cycles: number, pattern: string): Promise<void> {
  try {
    const existing = await getBreathingCycles(date);
    const data = {
      cycles: existing.cycles + cycles,
      pattern: pattern,
      lastSession: new Date().toISOString(),
    };
    await AsyncStorage.setItem(BREATHING_KEY_PREFIX + date, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save breathing cycles", e);
  }
}

export default function BreathingExerciseScreen() {
  const [isActive, setIsActive] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<keyof typeof BREATHING_PATTERNS>("4-7-8");
  const [currentPhase, setCurrentPhase] = useState<Phase>("inhale");
  const [countdown, setCountdown] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [todayCycles, setTodayCycles] = useState(0);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  const pattern = BREATHING_PATTERNS[selectedPattern];
  const today = getTodayString();
  
  useEffect(() => {
    loadTodayCycles();
  }, []);

  async function loadTodayCycles() {
    const data = await getBreathingCycles(today);
    setTodayCycles(data.cycles);
  }

  useEffect(() => {
    if (!isActive) return;

    const phaseDuration = getCurrentPhaseDuration();

    if (phaseDuration === 0) {
      moveToNextPhase();
      return;
    }

    setCountdown(phaseDuration);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          moveToNextPhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    animateCircle();

    return () => clearInterval(interval);
  }, [isActive, currentPhase]);

  const getCurrentPhaseDuration = () => {
    switch (currentPhase) {
      case "inhale": return pattern.inhale;
      case "hold": return pattern.hold;
      case "exhale": return pattern.exhale;
      case "rest": return pattern.rest;
      default: return 4;
    }
  };

  const moveToNextPhase = () => {
    const phases: Phase[] = ["inhale", "hold", "exhale", "rest"];
    const currentIndex = phases.indexOf(currentPhase);
    let nextIndex = (currentIndex + 1) % phases.length;

    while (true) {
      const nextPhase = phases[nextIndex];
      const duration = getPhaseTime(nextPhase);
      
      if (duration > 0) {
        setCurrentPhase(nextPhase);
        if (nextPhase === "inhale") {
          setCycles((prev) => prev + 1);
        }
        break;
      }
      
      nextIndex = (nextIndex + 1) % phases.length;
    }
  };

  const getPhaseTime = (phase: Phase) => {
    switch (phase) {
      case "inhale": return pattern.inhale;
      case "hold": return pattern.hold;
      case "exhale": return pattern.exhale;
      case "rest": return pattern.rest;
    }
  };

  const animateCircle = () => {
    const duration = getCurrentPhaseDuration() * 1000;

    if (currentPhase === "inhale") {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.5,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (currentPhase === "exhale") {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.6,
          duration: duration,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleStart = () => {
    setIsActive(true);
    setCycles(0);
    setCurrentPhase("inhale");
  };

  const handleStop = async () => {
    setIsActive(false);
    
    if (cycles > 0) {
      await saveBreathingCycles(today, cycles, pattern.name);
      setTodayCycles((prev) => prev + cycles);
    }
    
    setCurrentPhase("inhale");
    setCountdown(0);
    setCycles(0);
    scaleAnim.setValue(1);
    opacityAnim.setValue(0.6);
  };

  const getPhaseColor = () => {
    switch (currentPhase) {
      case "inhale": return "#7ED957";
      case "hold": return "#FFB347";
      case "exhale": return "#77B5FE";
      case "rest": return "#CB99C9";
      default: return "#7ED957";
    }
  };

  const getPhaseText = () => {
    switch (currentPhase) {
      case "inhale": return "Breathe In";
      case "hold": return "Hold";
      case "exhale": return "Breathe Out";
      case "rest": return "Rest";
    }
  };

  return (
    <LinearGradient colors={["#EEF7F1", "#F3F0FF"]} style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={{ height: 24 }} />

        <Text style={styles.title}>Calm Your Mind</Text>

        <View style={styles.patternContainer}>
          {(Object.keys(BREATHING_PATTERNS) as Array<keyof typeof BREATHING_PATTERNS>).map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.patternButton,
                selectedPattern === key && styles.patternButtonActive,
              ]}
              onPress={() => {
                if (!isActive) {
                  setSelectedPattern(key);
                }
              }}
              disabled={isActive}
            >
              <Text
                style={[
                  styles.patternButtonText,
                  selectedPattern === key && styles.patternButtonTextActive,
                ]}
              >
                {BREATHING_PATTERNS[key].name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.circleContainer}>
          <Animated.View
            style={[
              styles.breathingCircle,
              {
                backgroundColor: getPhaseColor(),
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            <Text style={styles.phaseText}>{getPhaseText()}</Text>
            {isActive && <Text style={styles.countdownText}>{countdown}</Text>}
          </Animated.View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pattern:</Text>
            <Text style={styles.infoValue}>{pattern.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Session cycles:</Text>
            <Text style={styles.infoValue}>{cycles}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowHighlight]}>
            <Text style={styles.infoLabelHighlight}>Today's total:</Text>
            <Text style={styles.infoValueHighlight}>{todayCycles + cycles}</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {!isActive ? (
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <Text style={styles.startButtonText}>Start</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
              <Text style={styles.stopButtonText}>Stop & Save</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 24,
    textAlign: "center",
  },
  patternContainer: {
    width: "50%",
    marginBottom: 32,
  },
  patternButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 25,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  patternButtonActive: {
    borderColor: "#66C07A",
    backgroundColor: "#F0FFF4",
  },
  patternButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666666",
    textAlign: "center",
  },
  patternButtonTextActive: {
    color: "#66C07A",
  },
  circleContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  phaseText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  countdownText: {
    fontSize: 48,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  infoCard: {
    width: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoRowHighlight: {
    backgroundColor: "#E8F5E9",
    marginHorizontal: -8,
    marginBottom: -8,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666666",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222222",
  },
  infoLabelHighlight: {
    fontSize: 14,
    fontWeight: "600",
    color: "#66C07A",
  },
  infoValueHighlight: {
    fontSize: 16,
    fontWeight: "800",
    color: "#66C07A",
  },
  buttonContainer: {
    width: "50%",
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: "#9810FA",
    paddingVertical: 16,
    borderRadius: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  stopButton: {
    backgroundColor: "#FF6961",
    paddingVertical: 16,
    borderRadius: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  stopButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});