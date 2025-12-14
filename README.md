늘 가방 속에 챙겨 다니는 나만의 자신감 부적, 오마모리.  그럼… 모바일앱으로 담아보는 거 어떨까….?

# LuckyRookie 

A React Native mobile application that helps users discover their daily luck through astrology and personalized fortune readings.

## About

LuckyRookie is your personal fortune companion that combines Eastern and Western divination traditions to provide daily guidance. Whether you're looking for your lucky hours, seeking romantic advice, or wanting to capture your fortunate moments, LuckyRookie offers a comprehensive suite of features wrapped in an elegant, intuitive interface.

## Key Features

###  Fortune Cookie
Get personalized horoscope readings based on your zodiac sign:
- Daily, weekly, and monthly forecasts
- Automatic zodiac sign calculation from your birthday
- Beautiful, easy-to-read horoscope display

### Lucky Time Oracle
Discover your most fortunate hours of the day:
- **Personal Day Number** - Numerology-based daily calculations
- **Birth Day Lucky Times** - Special time ranges based on your day of birth
  - Lucky times for success and prosperity
  - Love & romance windows
  - Times to avoid important activities
- **Real-time Status** - Live indicator showing if the current moment is lucky, romantic, or to be avoided
- **Countdown Timer** - Track time until your next lucky moment
- **Golden Hour** - Sunrise and sunset-based auspicious times for your location

###  Lucky Diary
Capture and preserve your fortunate moments:
- Daily journal entries with photo support
- Record your favorite songs and artists
- Describe what made you feel lucky
- Calendar view to browse past entries
- Camera integration for instant memory capture

###  Lucky Color Chart
Daily color guidance based on Korean astrology:
- Color recommendations for work, finance, love, and health
- Day-specific lucky and unlucky colors
- Beautiful visual color palettes
- Easy-to-navigate weekly color guide

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Routing**: Expo Router
- **UI Components**: React Native core components
- **Gradients**: expo-linear-gradient
- **Storage**: AsyncStorage for local data persistence
- **Camera**: expo-image-picker & expo-camera
- **Calendar**: react-native-calendars

## APIs Used

- **Horoscope API**: https://horoscope-app-api.vercel.app
- **Geocoding**: Open-Meteo Geocoding API
- **Sunrise/Sunset**: Sunrise-Sunset.org API

## Getting Started
```bash
# Install dependencies
npm install

# Start the development server
npx expo start

# Run on iOS
npx expo start --ios

# Run on Android
npx expo start --android
```

## Project Structure
```
app/
├── index.tsx                 # Home screen with feature cards
├── cookie.tsx               # Fortune cookie / Horoscope
├── time.tsx                 # Lucky time oracle
├── color.tsx                # Lucky color chart
├── luckyplaylist/
│   ├── index.tsx           # Calendar view
│   ├── note.tsx            # Diary entry form
│   └── camera.tsx          # Camera capture
└── _layout.tsx             # Navigation layout
```

## Features in Detail

### Numerology System
The app uses a numerology reduction system that calculates your Personal Day Number based on:
- Your birth month and day
- Current year, month, and day
- Reduction to a single digit (1-9)

Each number corresponds to specific lucky hours throughout the day.

### Birth Day Time Ranges
Based on the day of the week you were born, the app provides:
- **Lucky Times**: Best hours for important activities and decision-making
- **Love Times**: Optimal windows for romance and relationships
- **Unlucky Times**: Periods to avoid starting new ventures

### Real-time Updates
The countdown timer and current time status update every second, ensuring you never miss your lucky moment.


## Acknowledgments

- Horoscope data provided by Horoscope App API
- Location services by Open-Meteo
- Sunrise/sunset calculations by Sunrise-Sunset.org
- Inspired by traditional Eastern astrology and numerology practices

---

**May luck be with you!**
