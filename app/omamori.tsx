import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Period = "daily" | "weekly" | "monthly";

const BASE_URL = "https://horoscope-app-api.vercel.app/api/v1";
const periods: Period[] = ["daily", "weekly", "monthly"];

const HoroscopeScreen: React.FC = () => {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [sign, setSign] = useState<string | null>(null);

  const [selectedPeriod, setSelectedPeriod] = useState<Period>("daily");
  const [horoscopeText, setHoroscopeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const calculateZodiacSign = (m: number, d: number): string | null => {
    if (!m || !d) return null;

    if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return "aries";
    if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return "taurus";
    if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return "gemini";
    if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return "cancer";
    if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return "leo";
    if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return "virgo";
    if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return "libra";
    if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return "scorpio";
    if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return "sagittarius";
    if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return "capricorn";
    if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return "aquarius";
    if ((m === 2 && d >= 19) || (m === 3 && d <= 20)) return "pisces";

    return null;
  };

  const handleFindSign = () => {
    setErrorMsg(null);
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);

    if (isNaN(m) || isNaN(d) || m < 1 || m > 12 || d < 1 || d > 31) {
      setErrorMsg("Please enter a valid day and month.");
      setSign(null);
      return;
    }

    const zodiac = calculateZodiacSign(m, d);
    if (!zodiac) {
      setErrorMsg("Could not determine zodiac sign. Please check your date.");
      setSign(null);
      return;
    }

    setSign(zodiac);
  };

  useEffect(() => {
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);

    if (!isNaN(m) && !isNaN(d)) {
      const zodiac = calculateZodiacSign(m, d);
      setSign(zodiac);
    } else {
      setSign(null);
    }
  }, [month, day]);

  const fetchHoroscope = async () => {
    setErrorMsg(null);

    if (!sign) {
      setErrorMsg("Please enter your birthday so we can detect your sign first.");
      return;
    }

    setLoading(true);
    setHoroscopeText("");

    try {
      const apiSign = sign.charAt(0).toUpperCase() + sign.slice(1);

      let endpoint = "";
      if (selectedPeriod === "daily") {
        endpoint = `/get-horoscope/daily?sign=${encodeURIComponent(
          apiSign
        )}&day=TODAY`;
      } else if (selectedPeriod === "weekly") {
        endpoint = `/get-horoscope/weekly?sign=${encodeURIComponent(apiSign)}`;
      } else {
        endpoint = `/get-horoscope/monthly?sign=${encodeURIComponent(apiSign)}`;
      }

      const url = `${BASE_URL}${endpoint}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const json: any = await response.json();
      const text = json?.data?.horoscope_data ?? JSON.stringify(json, null, 2);

      setHoroscopeText(text);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#EEF7F1', '#F3F0FF']}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Image 
            style={styles.headerImage} 
            source={require("./images/pink_omamori.png")}
            resizeMode="contain"
          />
          <Text style={styles.title}>Omamori</Text>
          <Text style={styles.subtitle}>Fortune Telling...</Text>
        </View>

        {/* Birthday Input Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Birthday</Text>
          <View style={styles.row}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Day</Text>
              <TextInput
                keyboardType="number-pad"
                value={day}
                onChangeText={setDay}
                placeholder="7"
                placeholderTextColor="#999"
                style={styles.input}
              />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Month</Text>
              <TextInput
                keyboardType="number-pad"
                value={month}
                onChangeText={setMonth}
                placeholder="12"
                placeholderTextColor="#999"
                style={styles.input}
              />
            </View>
          </View>

          {sign && (
            <View style={styles.signBadge}>
              <Text style={styles.signLabel}>Your Zodiac Sign</Text>
              <Text style={styles.signText}>{sign.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Period Selection */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Choose Period</Text>
          <View style={styles.tabRow}>
            {periods.map((p) => {
              const isActive = p === selectedPeriod;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  onPress={() => setSelectedPeriod(p)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      isActive && styles.tabButtonTextActive,
                    ]}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Get Horoscope Button */}
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={fetchHoroscope}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#9810FA', '#7B00E0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryButtonGradient}
          >
            <Text style={styles.primaryButtonText}>
              Get {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Reading
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Error Message */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Result Card */}
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>
              {sign ? `${sign.toUpperCase()}` : "Your Reading"}
            </Text>
            {sign && (
              <View style={styles.periodBadge}>
                <Text style={styles.periodBadgeText}>{selectedPeriod.toUpperCase()}</Text>
              </View>
            )}
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#9810FA" />
              <Text style={styles.loadingText}>Reading the stars...</Text>
            </View>
          ) : (
            <ScrollView style={styles.resultScroll} nestedScrollEnabled>
              <Text style={styles.resultText}>
                {horoscopeText || "Your horoscope reading will appear here after you get your fortune."}
              </Text>
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default HoroscopeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  headerImage: {
    height: 140,
    width: 140,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#222222",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#222222",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    color: "#666666",
    fontSize: 13,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#222222",
    backgroundColor: "#FAFAFA",
    fontSize: 16,
    fontWeight: "600",
  },
  signBadge: {
    marginTop: 20,
    backgroundColor: "#FFF5F0",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFD1B8",
  },
  signLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  signText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FF8A3C",
    letterSpacing: 1,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 40,
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  tabButtonActive: {
    backgroundColor: "#9810FA",
  },
  tabButtonText: {
    color: "#666666",
    fontSize: 14,
    fontWeight: "700",
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
  },
  primaryButton: {
    borderRadius: 40,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#9810FA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonGradient: {
    paddingVertical: 18,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  errorBox: {
    backgroundColor: "#FFF0F0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFD1D1",
  },
  errorText: {
    color: "#C62828",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  resultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    minHeight: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#222222",
  },
  periodBadge: {
    backgroundColor: "#F3E5F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  periodBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9810FA",
    letterSpacing: 0.5,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#666",
  },
  resultScroll: {
    maxHeight: 300,
  },
  resultText: {
    color: "#444444",
    lineHeight: 24,
    fontSize: 15,
    fontWeight: "400",
  },
});