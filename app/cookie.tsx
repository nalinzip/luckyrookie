import { Audio } from "expo-av";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type QuoteApiItem = {
  quote: string;
  author: string;
  work: string;
  categories: string[];
};

type QuoteApiResponse = QuoteApiItem[];

const QUOTE_API_URL = "https://api.api-ninjas.com/v2/randomquotes?";

const API_KEY = "tEqXSO0pqaSLFblzXkiw+g==JgHwZgMYAgBLFnbZ";

const FortuneCookieScreen = () => {
  const [isOpened, setIsOpened] = useState(false);
  const [quote, setQuote] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    let soundObj: Audio.Sound | null = null;

    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("./cookie_sound.mp3")
        );
        soundObj = sound;
        setSound(sound);
      } catch (e) {
        console.warn("Failed to load sound:", e);
      }
    };

    loadSound();

    return () => {
      if (soundObj) {
        soundObj.unloadAsync();
      }
    };
  }, []);

  const playCrackSound = async () => {
    try {
      if (sound) {

        await sound.replayAsync();
      }
    } catch (e) {
      console.warn("Failed to play sound:", e);
    }
  };

  const fetchQuoteFromApi = async (): Promise<string> => {
    console.log("API_KEY (length):", API_KEY.length);

    const res = await fetch(QUOTE_API_URL, {
      method: "GET",
      headers: {
        "X-Api-Key": API_KEY,
      },
    });

    const rawText = await res.text();
    console.log("STATUS:", res.status);
    console.log("BODY:", rawText);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${rawText}`);
    }

    const data: QuoteApiResponse = JSON.parse(rawText);

    if (!data || data.length === 0 || !data[0].quote) {
      throw new Error("No quote in response");
    }

    return data[0].quote;
  };

  const handlePressCookie = async () => {
    if (isLoading) return;

    setIsOpened(true);
    setErrorMsg(null);

    playCrackSound();

    if (quote) return;

    try {
      setIsLoading(true);
      const fortune = await fetchQuoteFromApi();
      setQuote(fortune);
    } catch (err: any) {
      console.error("QUOTE API ERROR:", err?.message ?? err);
      setErrorMsg("Failed to load your fortune. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const titleText = isOpened
    ? "The fortune cookie wants to tell you that"
    : "Tap on the fortune cookie";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{titleText}</Text>

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.cookieWrapper}
        onPress={handlePressCookie}
      >
        <Image
          style={styles.cookieImage}
          source={
            isOpened
              ? require("./cookie_opened.png")
              : require("./cookie_closed.png")
          }
          resizeMode="contain"
        />
      </TouchableOpacity>

      {isOpened && (
        <View style={styles.messageContainer}>
          {isLoading && <ActivityIndicator size="small" />}

          {!isLoading && quote && (
            <Text style={styles.quoteText}>“{quote}”</Text>
          )}

          {!isLoading && !quote && errorMsg && (
            <Text style={styles.errorText}>{errorMsg}</Text>
          )}
        </View>
      )}
    </View>
  );
};

export default FortuneCookieScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 70,
    alignItems: "center",
  },
  header: {
    width: "100%",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  menuIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 32,
  },
  cookieWrapper: {
    width: "120%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cookieImage: {
    width: "100%",
    height: "100%",
  },
  messageContainer: {
    marginTop: 32,
    paddingHorizontal: 8,
  },
  quoteText: {
    fontSize: 18,
    textAlign: "center",
    lineHeight: 22,
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: "red",
    textAlign: "center",
  },
});
