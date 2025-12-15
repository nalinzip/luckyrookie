// app/luckyplaylist/note.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const CLOVER_KEY = "lucky-rookie-clovers";
const DIARY_DATES_KEY = "lucky-rookie-diary-dates";


async function getClovers(): Promise<number> {
  try {
    const value = await AsyncStorage.getItem(CLOVER_KEY);
    return value ? parseInt(value, 10) : 0;
  } catch (e) {
    return 0;
  }
}

async function addClover(): Promise<number> {
  try {
    const current = await getClovers();
    const newTotal = current + 1;
    await AsyncStorage.setItem(CLOVER_KEY, newTotal.toString());
    return newTotal;
  } catch (e) {
    return await getClovers();
  }
}

async function hasEarnedCloverForDate(date: string): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(DIARY_DATES_KEY);
    if (!value) return false;
    const dates: string[] = JSON.parse(value);
    return dates.includes(date);
  } catch (e) {
    return false;
  }
}

async function markDateAsRewarded(date: string): Promise<void> {
  try {
    const value = await AsyncStorage.getItem(DIARY_DATES_KEY);
    const dates: string[] = value ? JSON.parse(value) : [];
    if (!dates.includes(date)) {
      dates.push(date);
      await AsyncStorage.setItem(DIARY_DATES_KEY, JSON.stringify(dates));
    }
  } catch (e) {
    console.error("Failed to mark date", e);
  }
}

export default function LuckyNote() {
  const params = useLocalSearchParams();
  const date = (params.date as string) || "";
  const photoUriParam = (params.photoUri as string) || null;

  const [song, setSong] = useState("");
  const [artist, setArtist] = useState("");
  const [luckyNote, setLuckyNote] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(photoUriParam);
  const [status, setStatus] = useState<string | null>(null);
  const [showCloverReward, setShowCloverReward] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const storageKey = (d: string) => `lucky-diary-${d}`;

  // Load diary only once when component first mounts
  useEffect(() => {
    if (date && !hasLoaded) {
      loadDiaryOrTemp(date);
      setHasLoaded(true);
    }
  }, [date]);

  async function loadDiaryOrTemp(d: string) {
    try {
      // Check if there's temporary data (user went to camera and came back)
      const tempKey = `temp-diary-${d}`;
      const tempValue = await AsyncStorage.getItem(tempKey);
      
      if (tempValue) {
        const tempData = JSON.parse(tempValue);
        setSong(tempData.song || "");
        setArtist(tempData.artist || "");
        setLuckyNote(tempData.luckyNote || "");

        await AsyncStorage.removeItem(tempKey);
        setStatus("");
      } else {
        const value = await AsyncStorage.getItem(storageKey(d));
        if (value !== null) {
          const data = JSON.parse(value) as {
            song: string;
            artist: string;
            luckyNote: string;
            photoUri?: string | null;
          };
          setSong(data.song || "");
          setArtist(data.artist || "");
          setLuckyNote(data.luckyNote || "");
          if (!photoUriParam) {
            setPhotoUri(data.photoUri || null);
          }
          setStatus("Loaded successfully");
        } else {
          setSong("");
          setArtist("");
          setLuckyNote("");
          if (!photoUriParam) setPhotoUri(null);
          setStatus("No diary found for this date");
        }
      }
    } catch (e) {
      console.log(e);
      setStatus("Failed to load");
    }
  }
  useEffect(() => {
    if (photoUriParam) {
      setPhotoUri(photoUriParam);
    }
  }, [photoUriParam]);

  async function saveDiary() {
    try {
      const data = { song, artist, luckyNote, photoUri };
      await AsyncStorage.setItem(storageKey(date), JSON.stringify(data));
      
      const alreadyEarned = await hasEarnedCloverForDate(date);
      
      if (!alreadyEarned) {
        const newTotal = await addClover();
        await markDateAsRewarded(date);
        setShowCloverReward(true);
        setStatus(`🍀 +1 Clover earned! Total: ${newTotal}`);
        
        setTimeout(() => setShowCloverReward(false), 3000);
      } else {
        setStatus("Diary saved successfully!");
      }
    } catch (e) {
      console.log(e);
      setStatus("Failed to save");
    }
  }

  async function loadDiary(d: string) {
    try {
      const value = await AsyncStorage.getItem(storageKey(d));
      if (value !== null) {
        const data = JSON.parse(value) as {
          song: string;
          artist: string;
          luckyNote: string;
          photoUri?: string | null;
        };
        setSong(data.song || "");
        setArtist(data.artist || "");
        setLuckyNote(data.luckyNote || "");
        if (!photoUriParam) {
          setPhotoUri(data.photoUri || null);
        }
        setStatus("Loaded successfully");
      } else {
        if (!photoUriParam) {
          setSong("");
          setArtist("");
          setLuckyNote("");
          setPhotoUri(null);
          setStatus("No diary found for this date");
        } else {
          setStatus("");
        }
      }
    } catch (e) {
      console.log(e);
      setStatus("Failed to load");
    }
  }
  async function pickImageFromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setStatus("Permission denied");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
      setStatus("Photo selected");
    }
  }

  function openCameraPage() {
    const tempKey = `temp-diary-${date}`;
    const tempData = { song, artist, luckyNote };
    AsyncStorage.setItem(tempKey, JSON.stringify(tempData));
    
    router.push({
      pathname: "/luckyplaylist/camera",
      params: { date },
    });
  }

  return (
    <LinearGradient
      colors={['#EEF7F1', '#F3F0FF']}
      style={styles.gradient}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Lucky Diary</Text>
          <Text style={styles.subtitle}>Capture your lucky moments</Text>
        </View>

        {/* Date Badge */}
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeLabel}>Date</Text>
          <Text style={styles.dateBadgeText}>{date}</Text>
        </View>

        {/* Music Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Soundtrack</Text>
          </View>
          
          <View style={styles.field}>
            <Text style={styles.label}>Song Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Song of the day"
              value={song}
              onChangeText={setSong}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Artist</Text>
            <TextInput
              style={styles.input}
              placeholder="Artist or band name"
              value={artist}
              onChangeText={setArtist}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Memory Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lucky Moment</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>What made you feel lucky?</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              placeholder="Good perspective can turn things into luck  ... !  "
              value={luckyNote}
              onChangeText={setLuckyNote}
              multiline
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Photo Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Memory Photo</Text>
          </View>

          {photoUri ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
              <View style={styles.photoButtonRow}>
                <TouchableOpacity 
                  style={styles.photoActionButton} 
                  onPress={openCameraPage}
                  activeOpacity={0.8}
                >
                  <Text style={styles.photoActionButtonText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.photoActionButton} 
                  onPress={pickImageFromLibrary}
                  activeOpacity={0.8}
                >
                  <Text style={styles.photoActionButtonText}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.photoButtonsContainer}>
              <TouchableOpacity 
                style={styles.photoButtonWhite} 
                onPress={openCameraPage}
                activeOpacity={0.8}
              >
                <Text style={styles.photoButtonWhiteText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.photoButtonWhite} 
                onPress={pickImageFromLibrary}
                activeOpacity={0.8}
              >
                <Text style={styles.photoButtonWhiteText}>Upload</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={saveDiary}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#9810FA', '#7B00E0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonText}>Save Diary</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryActionButton]} 
            onPress={() => loadDiary(date)}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryActionButtonText}>Load</Text>
          </TouchableOpacity>
        </View>

        {/* Status Message */}
        {status && (
          <View style={[
            styles.statusCard,
            showCloverReward && styles.statusCardClover
          ]}>
            {showCloverReward && (
              <Text style={styles.cloverRewardIcon}>🍀</Text>
            )}
            <Text style={[
              styles.statusText,
              showCloverReward && styles.statusTextClover
            ]}>{status}</Text>
          </View>
        )}
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
    textAlign: "center",
    marginBottom: 8,
    color: "#222222",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#666",
    fontWeight: "500",
    fontStyle: "italic",
  },
  dateBadge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
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
    marginBottom: 4,
  },
  dateBadgeText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#9810FA",
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#222222",
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "600",
    color: "#444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    backgroundColor: "#FAFAFA",
    color: "#222222",
  },
  noteInput: {
    height: 120,
    textAlignVertical: "top",
  },
  photoContainer: {
    gap: 12,
  },
  photoPreview: {
    width: "100%",
    height: 280,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  photoButtonRow: {
    flexDirection: "row",
    gap: 12,
  },
  photoActionButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  photoActionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  photoButtonsContainer: {
    gap: 12,
  },
  photoButtonWhite: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  photoButtonWhiteText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "700",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#9810FA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonGradient: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryActionButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    shadowColor: "transparent",
  },
  secondaryActionButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "700",
    paddingVertical: 16,
    textAlign: "center",
  },
  statusCard: {
    backgroundColor: "#F8F4FF",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E8D9FF",
  },
  statusCardClover: {
    backgroundColor: "#E8F5E9",
    borderColor: "#66C07A",
    borderWidth: 2,
  },
  cloverRewardIcon: {
    fontSize: 32,
    textAlign: "center",
    marginBottom: 8,
  },
  statusText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: "#9810FA",
  },
  statusTextClover: {
    fontSize: 16,
    fontWeight: "800",
    color: "#66C07A",
  },
});