// app/luckyplaylist/camera.tsx
import React, { useRef, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Image } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function LuckyCamera() {
  const params = useLocalSearchParams();
  const date = (params.date as string) || "";

  const [facing, setFacing] = useState<"front" | "back">("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [img, setImg] = useState<string | null>(null);

  const camRef = useRef<CameraView | null>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <LinearGradient
        colors={['#EEF7F1', '#F3F0FF']}
        style={styles.container}
      >
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}></Text>
          <Text style={styles.permissionTitle}>Camera Permission</Text>
          <Text style={styles.permissionText}>
            We need your permission to capture your lucky moments
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton} 
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#66C07A', '#4CAF50']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.permissionButtonGradient}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  async function takePict() {
    if (!camRef.current) return;
    let photo = await camRef.current.takePictureAsync();
    setImg(photo.uri);

    router.push({
      pathname: "/luckyplaylist/note",
      params: { date, photoUri: photo.uri },
    });
  }

  return (
    <LinearGradient
      colors={['#EEF7F1', '#F3F0FF']}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Lucky Moment</Text>
          <Text style={styles.headerDate}>{date}</Text>
        </View>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={facing}
          ref={(r) => {
            camRef.current = r;
          }}
        />
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.controlButton, facing === "front" && styles.controlButtonActive]}
            onPress={() => setFacing("front")}
            activeOpacity={0.8}
          >
            <Text style={[styles.controlButtonText, facing === "front" && styles.controlButtonTextActive]}>
              Front
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.takeButton}
            onPress={takePict}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#9810FA', '#7B00E0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.takeButtonGradient}
            >
              <Text style={styles.takeButtonText}>Take</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, facing === "back" && styles.controlButtonActive]}
            onPress={() => setFacing("back")}
            activeOpacity={0.8}
          >
            <Text style={[styles.controlButtonText, facing === "back" && styles.controlButtonTextActive]}>
              Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Preview */}
      {img && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewLabel}>Preview</Text>
          <Image source={{ uri: img }} style={styles.previewImage} />
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#222222",
    marginBottom: 12,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#66C07A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  permissionButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  headerTextContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#222222",
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  cameraContainer: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  camera: {
    width: "100%",
    aspectRatio: 0.75,
    backgroundColor: "#000",
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  controlButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlButtonActive: {
    backgroundColor: "#F3E5F5",
    borderColor: "#9810FA",
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
  },
  controlButtonTextActive: {
    color: "#9810FA",
  },
  takeButton: {
    flex: 1.2,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#9810FA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  takeButtonGradient: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  takeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  previewContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: "center",
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  previewImage: {
    width: 120,
    height: 160,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});