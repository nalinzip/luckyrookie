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
  Modal,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const SPOTIFY_CLIENT_ID = "d5559fdfab2a4ac090d8521b3957edac";
const SPOTIFY_CLIENT_SECRET = "f4f826949ffb4f4f849d2c82e4835ef1";
const SPOTIFY_TOKEN_KEY = "spotify-app-token";
const SPOTIFY_TOKEN_EXPIRY_KEY = "spotify-app-token-expiry";

interface SpotifyTrack {
  name: string;
  artist: string;
  album: string;
  albumArt: string | null;
}

async function getSpotifyToken(): Promise<string | null> {
  try {
    const cachedToken = await AsyncStorage.getItem(SPOTIFY_TOKEN_KEY);
    const expiry = await AsyncStorage.getItem(SPOTIFY_TOKEN_EXPIRY_KEY);

    if (cachedToken && expiry && Date.now() < parseInt(expiry, 10)) {
      return cachedToken;
    }

    const credentials = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const data = await response.json();

    if (data.access_token) {
      const expiryTime = Date.now() + (data.expires_in - 60) * 1000;
      await AsyncStorage.setItem(SPOTIFY_TOKEN_KEY, data.access_token);
      await AsyncStorage.setItem(SPOTIFY_TOKEN_EXPIRY_KEY, expiryTime.toString());
      return data.access_token;
    }
    return null;
  } catch (e) {
    console.error("Error getting Spotify token:", e);
    return null;
  }
}

async function searchSpotifyTracks(query: string): Promise<SpotifyTrack[]> {
  if (!query.trim()) return [];

  const token = await getSpotifyToken();
  if (!token) return [];

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=15`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.tracks.items.map((track: any) => ({
      name: track.name,
      artist: track.artists.map((a: any) => a.name).join(", "),
      album: track.album.name,
      albumArt: track.album.images?.[1]?.url || track.album.images?.[0]?.url || null,
    }));
  } catch (e) {
    console.error("Spotify search error:", e);
    return [];
  }
}

const CLOVER_KEY = "lucky-rookie-clovers";
const DIARY_DATES_KEY = "lucky-rookie-diary-dates";
const BREATHING_KEY_PREFIX = "breathing-cycles-";

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

async function getBreathingCycles(date: string): Promise<{ cycles: number; pattern: string; lastSession: string | null }> {
  try {
    const value = await AsyncStorage.getItem(BREATHING_KEY_PREFIX + date);
    if (value) return JSON.parse(value);
    return { cycles: 0, pattern: "", lastSession: null };
  } catch (e) {
    return { cycles: 0, pattern: "", lastSession: null };
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
  const [albumArt, setAlbumArt] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [showCloverReward, setShowCloverReward] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [breathingData, setBreathingData] = useState<{ cycles: number; pattern: string; lastSession: string | null }>({ cycles: 0, pattern: "", lastSession: null });

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const storageKey = (d: string) => `lucky-diary-${d}`;

  useEffect(() => {
    if (date && !hasLoaded) {
      loadDiaryOrTemp(date);
      loadBreathingData(date);
      setHasLoaded(true);
    }
  }, [date]);

  async function loadBreathingData(d: string) {
    const data = await getBreathingCycles(d);
    setBreathingData(data);
  }

  async function loadDiaryOrTemp(d: string) {
    try {
      const tempKey = `temp-diary-${d}`;
      const tempValue = await AsyncStorage.getItem(tempKey);

      if (tempValue) {
        const tempData = JSON.parse(tempValue);
        setSong(tempData.song || "");
        setArtist(tempData.artist || "");
        setLuckyNote(tempData.luckyNote || "");
        setAlbumArt(tempData.albumArt || null);
        await AsyncStorage.removeItem(tempKey);
        setStatus("");
      } else {
        const value = await AsyncStorage.getItem(storageKey(d));
        if (value !== null) {
          const data = JSON.parse(value);
          setSong(data.song || "");
          setArtist(data.artist || "");
          setLuckyNote(data.luckyNote || "");
          setAlbumArt(data.albumArt || null);
          if (!photoUriParam) setPhotoUri(data.photoUri || null);
          setStatus("Loaded successfully");
        } else {
          setSong("");
          setArtist("");
          setLuckyNote("");
          setAlbumArt(null);
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
    if (photoUriParam) setPhotoUri(photoUriParam);
  }, [photoUriParam]);

  async function saveDiary() {
    try {
      const data = { song, artist, luckyNote, photoUri, albumArt };
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
        const data = JSON.parse(value);
        setSong(data.song || "");
        setArtist(data.artist || "");
        setLuckyNote(data.luckyNote || "");
        setAlbumArt(data.albumArt || null);
        if (!photoUriParam) setPhotoUri(data.photoUri || null);
        setStatus("Loaded successfully");
      } else {
        if (!photoUriParam) {
          setSong("");
          setArtist("");
          setLuckyNote("");
          setPhotoUri(null);
          setAlbumArt(null);
          setStatus("No diary found for this date");
        } else {
          setStatus("");
        }
      }
      loadBreathingData(d);
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
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
      setStatus("Photo selected");
    }
  }

  function openCameraPage() {
    const tempKey = `temp-diary-${date}`;
    const tempData = { song, artist, luckyNote, albumArt };
    AsyncStorage.setItem(tempKey, JSON.stringify(tempData));
    router.push({ pathname: "/luckyplaylist/camera", params: { date } });
  }

  function formatLastSession(isoString: string | null): string {
    if (!isoString) return "";
    const dateObj = new Date(isoString);
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  }

  function openSearchModal() {
    setShowSearchModal(true);
    setSearchQuery("");
    setSearchResults([]);
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    setIsSearching(true);
    const results = await searchSpotifyTracks(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  }

  function selectTrack(track: SpotifyTrack) {
    setSong(track.name);
    setArtist(track.artist);
    setAlbumArt(track.albumArt);
    setShowSearchModal(false);
    setStatus(`Selected: ${track.name}`);
  }

  return (
    <LinearGradient colors={["#EEF7F1", "#F3F0FF"]} style={styles.gradient}>
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

        {/* Breathing Stats Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Breathing Exercise</Text>
          </View>

          {breathingData.cycles > 0 ? (
            <View style={styles.breathingStatsContainer}>
              <View style={styles.breathingStat}>
                <Text style={styles.breathingStatValue}>{breathingData.cycles}</Text>
                <Text style={styles.breathingStatLabel}>Cycles</Text>
              </View>
              <View style={styles.breathingInfo}>
                <View style={styles.breathingPatternBadge}>
                  <Text style={styles.breathingPatternText}>{breathingData.pattern}</Text>
                </View>
                {breathingData.lastSession && (
                  <Text style={styles.breathingLastSession}>
                    Last session: {formatLastSession(breathingData.lastSession)}
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.noBreathingContainer}>
              <Text style={styles.noBreathingText}>No breathing exercises yet</Text>
              <Text style={styles.noBreathingSubtext}>Complete a session to track it here</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Soundtrack</Text>
          </View>

          <TouchableOpacity style={styles.spotifySearchButton} onPress={openSearchModal} activeOpacity={0.8}>
            <Text style={styles.spotifySearchButtonText}>Search on Spotify</Text>
          </TouchableOpacity>

          {albumArt && (
            <View style={styles.albumArtContainer}>
              <Image source={{ uri: albumArt }} style={styles.albumArtPreview} />
            </View>
          )}

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

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Memory Photo</Text>
          </View>

          {photoUri ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
              <View style={styles.photoButtonRow}>
                <TouchableOpacity style={styles.photoActionButton} onPress={openCameraPage} activeOpacity={0.8}>
                  <Text style={styles.photoActionButtonText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoActionButton} onPress={pickImageFromLibrary} activeOpacity={0.8}>
                  <Text style={styles.photoActionButtonText}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.photoButtonsContainer}>
              <TouchableOpacity style={styles.photoButtonWhite} onPress={openCameraPage} activeOpacity={0.8}>
                <Text style={styles.photoButtonWhiteText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoButtonWhite} onPress={pickImageFromLibrary} activeOpacity={0.8}>
                <Text style={styles.photoButtonWhiteText}>Upload</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={saveDiary} activeOpacity={0.8}>
            <LinearGradient
              colors={["#9810FA", "#7B00E0"]}
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

        {status && (
          <View style={[styles.statusCard, showCloverReward && styles.statusCardClover]}>
            {showCloverReward && <Text style={styles.cloverRewardIcon}>🍀</Text>}
            <Text style={[styles.statusText, showCloverReward && styles.statusTextClover]}>{status}</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showSearchModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search Songs</Text>
            <TouchableOpacity onPress={() => setShowSearchModal(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a song or artist..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoFocus
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch} activeOpacity={0.8}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.searchResults}>
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1DB954" />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              searchResults.map((track, index) => (
                <TouchableOpacity
                  key={`${track.name}-${index}`}
                  style={styles.trackItem}
                  onPress={() => selectTrack(track)}
                  activeOpacity={0.7}
                >
                  {track.albumArt ? (
                    <Image source={{ uri: track.albumArt }} style={styles.trackAlbumArt} />
                  ) : (
                    <View style={[styles.trackAlbumArt, styles.trackAlbumArtPlaceholder]}>
                      <Text style={styles.trackPlaceholderText}>🎵</Text>
                    </View>
                  )}
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackName} numberOfLines={1}>{track.name}</Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
                    <Text style={styles.trackAlbum} numberOfLines={1}>{track.album}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : searchQuery ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No results found</Text>
                <Text style={styles.emptySubtext}>Try a different search term</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Search for your favorite songs</Text>
                <Text style={styles.emptySubtext}>Enter a song title or artist name</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { padding: 20, paddingTop: 40, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 24 },
  title: { fontSize: 32, fontWeight: "900", textAlign: "center", marginBottom: 8, color: "#222222", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, textAlign: "center", color: "#666", fontWeight: "500", fontStyle: "italic" },
  dateBadge: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 20, alignItems: "center", borderWidth: 1, borderColor: "#E0E0E0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  dateBadgeLabel: { fontSize: 12, fontWeight: "600", color: "#999", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  dateBadgeText: { fontSize: 20, fontWeight: "800", color: "#9810FA" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#E0E0E0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#222222" },
  field: { marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 8, fontWeight: "600", color: "#444" },
  input: { borderWidth: 1, borderColor: "#E0E0E0", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, backgroundColor: "#FAFAFA", color: "#222222" },
  noteInput: { height: 120, textAlignVertical: "top" },
  spotifySearchButton: { backgroundColor: "#1DB954", borderRadius: 25, paddingVertical: 14, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 },
  spotifyIcon: { fontSize: 18 },
  spotifySearchButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  albumArtContainer: { alignItems: "center", marginBottom: 16 },
  albumArtPreview: { width: 120, height: 120, borderRadius: 12, borderWidth: 1, borderColor: "#E0E0E0" },
  breathingStatsContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  breathingStat: { alignItems: "center", backgroundColor: "#E3F2FD", paddingHorizontal: 24, paddingVertical: 16, borderRadius: 16 },
  breathingStatValue: { fontSize: 40, fontWeight: "900", color: "#77B5FE" },
  breathingStatLabel: { fontSize: 12, fontWeight: "600", color: "#5A9BD4", textTransform: "uppercase", letterSpacing: 1, marginTop: 4 },
  breathingInfo: { flex: 1, alignItems: "flex-end", gap: 8 },
  breathingPatternBadge: { backgroundColor: "#E3F2FD", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  breathingPatternText: { fontSize: 14, fontWeight: "600", color: "#77B5FE" },
  breathingLastSession: { fontSize: 12, color: "#999", fontWeight: "500" },
  noBreathingContainer: { alignItems: "center", paddingVertical: 20 },
  noBreathingText: { fontSize: 16, color: "#666", fontWeight: "600", marginBottom: 4 },
  noBreathingSubtext: { fontSize: 13, color: "#999", fontStyle: "italic" },
  photoContainer: { gap: 12 },
  photoPreview: { width: "100%", height: 280, borderRadius: 16, borderWidth: 1, borderColor: "#E0E0E0" },
  photoButtonRow: { flexDirection: "row", gap: 12 },
  photoActionButton: { flex: 1, backgroundColor: "#F5F5F5", paddingVertical: 12, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: "#E0E0E0" },
  photoActionButtonText: { fontSize: 14, fontWeight: "600", color: "#666" },
  photoButtonsContainer: { gap: 12 },
  photoButtonWhite: { backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: "#E0E0E0", borderRadius: 40, paddingVertical: 16, alignItems: "center" },
  photoButtonWhiteText: { color: "#666", fontSize: 16, fontWeight: "700" },
  actionButtonsContainer: { flexDirection: "row", gap: 12, marginTop: 8 },
  actionButton: { flex: 1, borderRadius: 40, overflow: "hidden", shadowColor: "#9810FA", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  actionButtonGradient: { flex: 1, paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  actionButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  secondaryActionButton: { backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: "#E0E0E0", shadowColor: "transparent" },
  secondaryActionButtonText: { color: "#666", fontSize: 16, fontWeight: "700", paddingVertical: 16, textAlign: "center" },
  statusCard: { backgroundColor: "#F8F4FF", borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: "#E8D9FF" },
  statusCardClover: { backgroundColor: "#E8F5E9", borderColor: "#66C07A", borderWidth: 2 },
  cloverRewardIcon: { fontSize: 32, textAlign: "center", marginBottom: 8 },
  statusText: { textAlign: "center", fontSize: 14, fontWeight: "600", color: "#9810FA" },
  statusTextClover: { fontSize: 16, fontWeight: "800", color: "#66C07A" },
  modalContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1, borderBottomColor: "#E0E0E0", backgroundColor: "#FAFAFA" },
  modalTitle: { fontSize: 22, fontWeight: "800", color: "#222222" },
  modalCloseButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F0F0F0", alignItems: "center", justifyContent: "center" },
  modalCloseText: { fontSize: 18, color: "#666", fontWeight: "600" },
  searchInputContainer: { flexDirection: "row", padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  searchInput: { flex: 1, backgroundColor: "#F5F5F5", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: "#222222" },
  searchButton: { backgroundColor: "#1DB954", borderRadius: 12, paddingHorizontal: 20, alignItems: "center", justifyContent: "center" },
  searchButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  searchResults: { flex: 1 },
  loadingContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 16 },
  loadingText: { fontSize: 16, color: "#666", fontWeight: "500" },
  trackItem: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14, borderBottomWidth: 1, borderBottomColor: "#F5F5F5" },
  trackAlbumArt: { width: 60, height: 60, borderRadius: 8 },
  trackAlbumArtPlaceholder: { backgroundColor: "#F0F0F0", alignItems: "center", justifyContent: "center" },
  trackPlaceholderText: { fontSize: 24 },
  trackInfo: { flex: 1, gap: 2 },
  trackName: { fontSize: 16, fontWeight: "600", color: "#222222" },
  trackArtist: { fontSize: 14, color: "#666" },
  trackAlbum: { fontSize: 12, color: "#999" },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 80, gap: 8 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyText: { fontSize: 18, color: "#666", fontWeight: "600" },
  emptySubtext: { fontSize: 14, color: "#999" },
});