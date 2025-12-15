import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type GeoResult = {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
};

type SunApiResponse = {
  results: {
    sunrise: string;
    sunset: string;
    solar_noon?: string;
    day_length?: number;
  };
  status: string;
};

type DayTimeRanges = {
  lucky: string[];
  love: string[];
  unlucky: string[];
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function fmtTime(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function reduceTo1to9(n: number) {
  let x = Math.abs(Math.floor(n));
  while (x > 9) {
    x = String(x)
      .split("")
      .reduce((s, ch) => s + Number(ch), 0);
  }
  return x === 0 ? 9 : x;
}

function parseYYYYMMDD(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const yyyy = Number(m[1]);
  const mm = Number(m[2]);
  const dd = Number(m[3]);
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return d;
}

function personalDayNumber(birth: Date, today: Date) {
  const raw =
    (birth.getMonth() + 1) +
    birth.getDate() +
    today.getFullYear() +
    (today.getMonth() + 1) +
    today.getDate();
  return reduceTo1to9(raw);
}

// Lucky time ranges based on day of birth (from the image)
const DAY_TIME_RANGES: Record<number, DayTimeRanges> = {
  1: { // Monday
    lucky: ["06:01 - 07:00", "13:31 - 19:30"],
    love: ["20:01 - 24:00"],
    unlucky: ["07:01 - 13:00", "00:01 - 03:00"],
  },
  2: { // Tuesday
    lucky: ["15:01 - 16:00", "19:01 - 21:00"],
    love: ["10:01 - 13:00", "22:01 - 01:01"],
    unlucky: ["03:01 - 06:30"],
  },
  3: { // Wednesday
    lucky: ["06:01 - 09:30", "14:30 - 19:30"],
    love: ["21:01 - 01:00", "22:01 - 01:01"],
    unlucky: ["09:01 - 14:00"],
  },
  4: { // Thursday
    lucky: ["06:01 - 07:00", "09:01 - 13:00"],
    love: ["13:31 - 19:30"],
    unlucky: ["07:01 - 09:00", "01:01 - 03:00"],
  },
  5: { // Friday
    lucky: ["06:01 - 12:00", "15:31 - 16:00"],
    love: ["19:01 - 23:00"],
    unlucky: ["12:01 - 15:00", "23:01 - 03:00"],
  },
  6: { // Saturday
    lucky: ["15:01 - 23:00"],
    love: ["07:01 - 14:00"],
    unlucky: ["14:01 - 15:00", "01:01 - 05:00"],
  },
  0: { // Sunday
    lucky: ["07:31 - 12:30", "20:01 - 24:00"],
    love: ["12:31 - 13:30", "01:01 - 03:00"],
    unlucky: ["06:31 - 07:30", "16:01 - 17:00"],
  },
};

const LUCKY_HOUR_MAP: Record<number, number[]> = {
  1: [9, 15, 21],
  2: [10, 16, 20],
  3: [11, 14, 19],
  4: [8, 13, 18],
  5: [12, 17, 22],
  6: [7, 14, 20],
  7: [6, 15, 23],
  8: [9, 18, 21],
  9: [11, 16, 22],
};

function buildLuckyTimesForToday(today: Date, hours: number[]) {
  const now = new Date();
  const out: { label: string; when: Date }[] = [];

  for (const h of hours) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, 11, 0, 0);
    if (d <= now) {
      const tmr = new Date(d);
      tmr.setDate(tmr.getDate() + 1);
      out.push({ label: `Next ${pad2(h)}:11`, when: tmr });
    } else {
      out.push({ label: `Today ${pad2(h)}:11`, when: d });
    }
  }

  out.sort((a, b) => a.when.getTime() - b.when.getTime());
  return out;
}

function msToCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
}

async function geocodeCity(name: string): Promise<GeoResult[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    name
  )}&count=5&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("City search failed.");
  const json = await res.json();
  return (json?.results ?? []) as GeoResult[];
}

async function fetchSunTimes(lat: number, lon: number): Promise<SunApiResponse> {
  const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Sunrise/sunset fetch failed.");
  return (await res.json()) as SunApiResponse;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Function to check if current time is in a time range
function isTimeInRange(currentTime: Date, rangeStr: string): boolean {
  const [start, end] = rangeStr.split(' - ');
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;
  
  // Handle ranges that cross midnight
  if (endMinutes < startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }
  
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

function getCurrentTimeStatus(dayTimeRanges: DayTimeRanges | null, currentTime: Date): {
  status: 'lucky' | 'love' | 'unlucky' | 'neutral';
  message: string;
} | null {
  if (!dayTimeRanges) return null;
  
  for (const range of dayTimeRanges.lucky) {
    if (isTimeInRange(currentTime, range)) {
      return { status: 'lucky', message: 'Lucky Time!' };
    }
  }
  
  for (const range of dayTimeRanges.love) {
    if (isTimeInRange(currentTime, range)) {
      return { status: 'love', message: 'Charming Time!' };
    }
  }
  
  for (const range of dayTimeRanges.unlucky) {
    if (isTimeInRange(currentTime, range)) {
      return { status: 'unlucky', message: 'Avoid this time' };
    }
  }
  
  return { status: 'neutral', message: 'Neutral Time' };
}

export default function App() {
  const [birthStr, setBirthStr] = useState("2002-12-07");
  const [city, setCity] = useState("Seoul");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [place, setPlace] = useState<GeoResult | null>(null);
  const [sunrise, setSunrise] = useState<Date | null>(null);
  const [sunset, setSunset] = useState<Date | null>(null);

  const [luckyList, setLuckyList] = useState<{ label: string; when: Date }[]>([]);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const personalDay = useMemo(() => {
    const birth = parseYYYYMMDD(birthStr);
    if (!birth) return null;
    return personalDayNumber(birth, new Date());
  }, [birthStr, nowTick]);

  const birthDayOfWeek = useMemo(() => {
    const birth = parseYYYYMMDD(birthStr);
    if (!birth) return null;
    return birth.getDay();
  }, [birthStr]);

  const dayTimeRanges = useMemo(() => {
    if (birthDayOfWeek === null) return null;
    return DAY_TIME_RANGES[birthDayOfWeek];
  }, [birthDayOfWeek]);

  const currentTimeStatus = useMemo(() => {
    return getCurrentTimeStatus(dayTimeRanges, new Date(nowTick));
  }, [dayTimeRanges, nowTick]);

  const nextLucky = useMemo(() => {
    if (!luckyList.length) return null;
    const now = Date.now();
    return luckyList.find((x) => x.when.getTime() > now) ?? luckyList[0];
  }, [luckyList, nowTick]);

  const countdown = useMemo(() => {
    if (!nextLucky) return null;
    return msToCountdown(nextLucky.when.getTime() - Date.now());
  }, [nextLucky, nowTick]);

  const goldenHour = useMemo(() => {
    if (!sunrise || !sunset) return null;

    const morningStart = new Date(sunrise);
    const morningEnd = new Date(sunrise);
    morningEnd.setMinutes(morningEnd.getMinutes() + 60);

    const eveningStart = new Date(sunset);
    eveningStart.setMinutes(eveningStart.getMinutes() - 60);
    const eveningEnd = new Date(sunset);

    return { morningStart, morningEnd, eveningStart, eveningEnd };
  }, [sunrise, sunset]);

  const reveal = async () => {
    try {
      setErr(null);
      setLoading(true);

      const birth = parseYYYYMMDD(birthStr);
      if (!birth) {
        setErr("Birth date format must be YYYY-MM-DD (e.g., 2002-12-07).");
        return;
      }

      const today = new Date();
      const pd = personalDayNumber(birth, today);
      const hours = LUCKY_HOUR_MAP[pd] ?? [11, 16, 22];
      setLuckyList(buildLuckyTimesForToday(today, hours));

      const trimmedCity = city.trim();
      if (trimmedCity.length) {
        const geo = await geocodeCity(trimmedCity);
        if (!geo.length) {
          setPlace(null);
          setSunrise(null);
          setSunset(null);
          setErr("City not found. Lucky times still work without city.");
          return;
        }

        const p = geo[0];
        setPlace(p);

        const sun = await fetchSunTimes(p.latitude, p.longitude);
        if (sun.status !== "OK") throw new Error("Sun API returned non-OK status.");

        setSunrise(new Date(sun.results.sunrise));
        setSunset(new Date(sun.results.sunset));
      } else {
        setPlace(null);
        setSunrise(null);
        setSunset(null);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#EEF7F1', '#F3F0FF']}
      style={styles.root}
    >
      <ScrollView contentContainerStyle={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Lucky Time</Text>
          <Text style={styles.subtitle}>Discover your personal lucky hours</Text>
        </View>

        {/* Input Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Birth Date</Text>
            <TextInput
              value={birthStr}
              onChangeText={setBirthStr}
              placeholder="YYYY-MM-DD" 
              placeholderTextColor="#999"
              style={styles.input}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current City (optional)</Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="Seoul"
              placeholderTextColor="#999"
              style={styles.input}
              autoCapitalize="words"
            />
          </View>

          <TouchableOpacity style={styles.btn} onPress={reveal} disabled={loading}>
            <LinearGradient
              colors={['#9810FA', '#7B00E0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btnGradient}
            >
              <Text style={styles.btnText}>
                {loading ? "Revealing..." : "Reveal Lucky Times"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#9810FA" />
              <Text style={styles.loadingText}>Calculating your time luck...</Text>
            </View>
          )}

          {err && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {err}</Text>
            </View>
          )}
        </View>

        {/* Birth Day Time Ranges */}
        {birthDayOfWeek !== null && dayTimeRanges && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Lucky Times by Birth Day</Text>
            <View style={styles.birthDayBadge}>
              <Text style={styles.birthDayLabel}>Born on</Text>
              <Text style={styles.birthDayName}>{DAY_NAMES[birthDayOfWeek]}</Text>
            </View>

            {/* Current Time Status */}
            {currentTimeStatus && (
              <View style={[
                styles.currentTimeCard,
                currentTimeStatus.status === 'lucky' && styles.currentTimeLucky,
                currentTimeStatus.status === 'love' && styles.currentTimeLove,
                currentTimeStatus.status === 'unlucky' && styles.currentTimeUnlucky,
                currentTimeStatus.status === 'neutral' && styles.currentTimeNeutral,
              ]}>
                <Text style={styles.currentTimeLabel}>CURRENT TIME</Text>
                <Text style={styles.currentTimeTime}>
                  {new Date(nowTick).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  })}
                </Text>
                <Text style={styles.currentTimeStatus}>{currentTimeStatus.message}</Text>
              </View>
            )}

            <View style={styles.timeRangeSection}>
              <View style={styles.timeRangeHeader}>
                <View style={[styles.timeRangeDot, { backgroundColor: "#4CAF50" }]} />
                <Text style={styles.timeRangeTitle}>Lucky Times</Text>
              </View>
              {dayTimeRanges.lucky.map((range, idx) => (
                <Text key={idx} style={styles.timeRangeText}>{range}</Text>
              ))}
            </View>

            <View style={styles.timeRangeSection}>
              <View style={styles.timeRangeHeader}>
                <View style={[styles.timeRangeDot, { backgroundColor: "#FF69B4" }]} />
                <Text style={styles.timeRangeTitle}>Love & Romance</Text>
              </View>
              {dayTimeRanges.love.map((range, idx) => (
                <Text key={idx} style={styles.timeRangeText}>{range}</Text>
              ))}
            </View>

            <View style={styles.timeRangeSection}>
              <View style={styles.timeRangeHeader}>
                <View style={[styles.timeRangeDot, { backgroundColor: "#F44336" }]} />
                <Text style={styles.timeRangeTitle}>Avoid These Times</Text>
              </View>
              {dayTimeRanges.unlucky.map((range, idx) => (
                <Text key={idx} style={[styles.timeRangeText, { color: "#F44336" }]}>{range}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Personal Day Card */}
        {personalDay && (
          <View style={styles.card}>
            <View style={styles.personalDayHeader}>
              <View style={styles.personalDayBadge}>
                <Text style={styles.personalDayNumber}>{personalDay}</Text>
              </View>
              <View style={styles.personalDayTextContainer}>
                <Text style={styles.personalDayLabel}>Your Personal Day Number</Text>
                <Text style={styles.personalDaySubtext}>Based on numerology</Text>
              </View>
            </View>
          </View>
        )}

        {/* Countdown Card */}
        {nextLucky && countdown && (
          <View style={styles.countdownCard}>
            <LinearGradient
              colors={['#9810FA', '#7B00E0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.countdownGradient}
            >
              <Text style={styles.countdownLabel}>Next Lucky Moment</Text>
              <Text style={styles.countdownTime}>{countdown}</Text>
              <Text style={styles.countdownDetail}>
                {fmtTime(nextLucky.when)} • {nextLucky.label}
              </Text>
            </LinearGradient>
          </View>
        )}

        {/* Lucky Times List */}
        {luckyList.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your Lucky Times Today</Text>
            {luckyList.map((x, idx) => (
              <View key={idx} style={styles.timeRow}>
                <View style={styles.timeLeft}>
                  <Text style={styles.timeLabel}>{x.label}</Text>
                </View>
                <Text style={styles.timeRight}>{fmtTime(x.when)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Golden Hour Card */}
        {place && goldenHour && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Golden Hour Magic</Text>
            <Text style={styles.placeText}>
              {place.name}
              {place.admin1 ? `, ${place.admin1}` : ""}
              {place.country ? ` • ${place.country}` : ""}
            </Text>

            <View style={styles.goldenHourRow}>
              <View style={styles.goldenHourItem}>
                <Text style={styles.goldenHourLabel}>Morning</Text>
                <Text style={styles.goldenHourTime}>
                  {fmtTime(goldenHour.morningStart)} - {fmtTime(goldenHour.morningEnd)}
                </Text>
              </View>
              <View style={styles.goldenHourDivider} />
              <View style={styles.goldenHourItem}>
                <Text style={styles.goldenHourLabel}>Evening</Text>
                <Text style={styles.goldenHourTime}>
                  {fmtTime(goldenHour.eveningStart)} - {fmtTime(goldenHour.eveningEnd)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  page: { padding: 20, paddingBottom: 40 },

  header: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 20,
  },
  title: { 
    fontSize: 32, 
    fontWeight: "900", 
    color: "#222222",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: { 
    fontSize: 16, 
    color: "#666", 
    textAlign: "center",
    fontWeight: "500",
  },

  card: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 20,
    padding: 20,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "800", 
    marginBottom: 16, 
    color: "#222222",
  },

  inputGroup: {
    marginBottom: 16,
  },
  label: { 
    marginBottom: 8, 
    color: "#444", 
    fontWeight: "600",
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    color: "#222",
  },

  btn: {
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#9810FA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  btnText: { 
    color: "#fff", 
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },

  loadingContainer: { 
    marginTop: 16, 
    alignItems: "center", 
    gap: 8,
  },
  loadingText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },

  errorBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFF0F0",
    borderWidth: 1,
    borderColor: "#FFD1D1",
  },
  errorText: { 
    color: "#C62828", 
    fontWeight: "600",
    fontSize: 14,
  },

  birthDayBadge: {
    backgroundColor: "#F3E5F5",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  birthDayLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  birthDayName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#9810FA",
  },

  currentTimeCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
  },
  currentTimeLucky: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  currentTimeLove: {
    backgroundColor: "#FCE4EC",
    borderColor: "#FF69B4",
  },
  currentTimeUnlucky: {
    backgroundColor: "#FFEBEE",
    borderColor: "#F44336",
  },
  currentTimeNeutral: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E0E0E0",
  },
  currentTimeLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  currentTimeTime: {
    fontSize: 36,
    fontWeight: "900",
    color: "#222",
    marginBottom: 8,
    letterSpacing: -1,
  },
  currentTimeStatus: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },

  timeRangeSection: {
    marginBottom: 20,
  },
  timeRangeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  timeRangeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timeRangeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  timeRangeText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#444",
    marginLeft: 22,
    marginBottom: 6,
  },

  personalDayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  personalDayBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F3E5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  personalDayNumber: {
    fontSize: 32,
    fontWeight: "900",
    color: "#9810FA",
  },
  personalDayTextContainer: {
    flex: 1,
  },
  personalDayLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },
  personalDaySubtext: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },

  countdownCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#9810FA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  countdownGradient: {
    padding: 24,
    alignItems: "center",
  },
  countdownLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  countdownTime: {
    fontSize: 48,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: -1,
  },
  countdownDetail: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    opacity: 0.95,
  },

  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  timeLeft: {
    flex: 1,
  },
  timeLabel: { 
    fontWeight: "600", 
    color: "#444",
    fontSize: 15,
  },
  timeRight: { 
    fontWeight: "700", 
    color: "#9810FA",
    fontSize: 16,
  },

  placeText: {
    color: "#666",
    fontSize: 14,
    marginBottom: 20,
    fontWeight: "500",
  },

  goldenHourRow: {
    flexDirection: "row",
    gap: 16,
  },
  goldenHourItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    padding: 16,
    borderRadius: 12,
  },
  goldenHourDivider: {
    width: 1,
    backgroundColor: "#E0E0E0",
  },
  goldenHourLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  goldenHourTime: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
    textAlign: "center",
  },
});