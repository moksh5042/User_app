<<<<<<< HEAD
// App.js
import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  Provider as PaperProvider,
  DefaultTheme,
  Button,
  Text,
  ActivityIndicator
} from "react-native-paper";

import * as KeepAwake from "expo-keep-awake";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { ref, set } from "firebase/database";
import { db } from "./firebaseConfig";

import HeaderComponent from "./components/HeaderComponent";
import LocationCard from "./components/LocationCard";
import StatsGrid from "./components/StatsGrid";
import ActivityLog from "./components/ActivityLog";
import { haversineDistance } from "./components/distance";

const THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#1e88e5",
    accent: "#03dac4"
  }
};

const STORAGE_KEYS = {
  DRIVER_ID: "driverId",
  SESSION: "driverSession",
  ACTIVITY_LOG: "activityLog"
};

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [driverId, setDriverId] = useState(null);
  const [location, setLocation] = useState(null);
  const [activityLog, setActivityLog] = useState([]); // last 10 updates
  const [sessionStats, setSessionStats] = useState({
    distanceMeters: 0,
    startTime: null,
    durationSeconds: 0,
    avgSpeed: 0
  });
  const watchRef = useRef(null);
  const prevLocationRef = useRef(null);
  const intervalRef = useRef(null);

  // Load driverId and session from storage on mount
  useEffect(() => {
    (async () => {
      const storedDriver = await AsyncStorage.getItem(STORAGE_KEYS.DRIVER_ID);
      const storedActivity = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG);
      const storedSession = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);

      if (storedDriver) setDriverId(storedDriver);

      if (storedActivity) {
        try {
          setActivityLog(JSON.parse(storedActivity));
        } catch { /* ignore */ }
      }

      if (storedSession) {
        try {
          setSessionStats(JSON.parse(storedSession));
        } catch { /* ignore */ }
      }
    })();
  }, []);

  // Ask permission when app starts
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === "granted");
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Location permission is required to track the bus. Please enable it in settings."
        );
      }
    })();
  }, []);

  // Keep the screen awake when tracking
  useEffect(() => {
    if (isTracking) {
      KeepAwake.activateKeepAwake();
    } else {
      KeepAwake.deactivateKeepAwake();
    }
    return () => KeepAwake.deactivateKeepAwake();
  }, [isTracking]);

  // Helper: save activity log (only last 10)
  const persistActivityLog = async (newLog) => {
    const slice = newLog.slice(0, 10);
    setActivityLog(slice);
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(slice));
  };

  // Helper: persist session
  const persistSession = async (session) => {
    setSessionStats(session);
    await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  };

  // Send data to Firebase Realtime Database under buses/<driverId>
  const pushToFirebase = async (driverIdLocal, payload) => {
    if (!driverIdLocal) return;
    try {
      await set(ref(db, `buses/${driverIdLocal}`), payload);
    } catch (err) {
      console.warn("Firebase push error:", err);
    }
  };

  // Called on each location update
  const handleLocationUpdate = async (loc) => {
    const { coords } = loc;
    const { latitude, longitude, speed, accuracy } = coords;
    const ts = Math.floor(Date.now() / 1000);

    // Save current location in state
    setLocation({ latitude, longitude, speed: speed ?? 0, accuracy, timestamp: ts });

    // Session length & distance
    const prev = prevLocationRef.current;
    let newDistance = sessionStats.distanceMeters;
    if (prev) {
      const d = haversineDistance(prev.latitude, prev.longitude, latitude, longitude);
      newDistance += d;
    } else {
      // set start time on first update
      const start = sessionStats.startTime ?? Date.now();
      await persistSession({ ...sessionStats, startTime: start });
    }

    const now = Date.now();
    const startTime = sessionStats.startTime ?? now;
    const durationSeconds = Math.floor((now - startTime) / 1000);
    const avgSpeed = durationSeconds > 0 ? (newDistance / durationSeconds) : 0;

    const newSession = {
      distanceMeters: newDistance,
      startTime,
      durationSeconds,
      avgSpeed
    };
    await persistSession(newSession);
    prevLocationRef.current = { latitude, longitude, timestamp: ts };

    // Activity log: prepend
    const entry = {
      lat: latitude,
      lng: longitude,
      speed: speed ?? 0,
      accuracy,
      timestamp: ts
    };
    const newLog = [entry, ...activityLog].slice(0, 10);
    await persistActivityLog(newLog);

    // If GPS accuracy poor -> haptic and notification (optional)
    if (accuracy > 50) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Poor GPS accuracy",
            body: `Current accuracy: ${Math.round(accuracy)}m`
          },
          trigger: null
        });
      } catch (err) {
        // scheduling notifications may need permission
      }
    }

    // Build payload to send to realtime DB
    const payload = {
      lat: latitude,
      lng: longitude,
      speed: speed ?? 0,
      accuracy,
      timestamp: ts
    };

    // Push to firebase
    await pushToFirebase(driverId, payload);
  };

  // Start location tracking
  const startTracking = async () => {
    if (!hasPermission) {
      Alert.alert("No permission", "Location permission not granted.");
      return;
    }
    if (!driverId) {
      // prompt to set driver id — simple prompt using Alert.prompt on iOS only — fallback to default
      const defaultId = `driver_${Math.floor(Math.random() * 10000)}`;
      setDriverId(defaultId);
      await AsyncStorage.setItem(STORAGE_KEYS.DRIVER_ID, defaultId);
    }

    // Use watchPositionAsync for continuous updates; set highAccuracy and timeInterval
    try {
      const subscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 7000, // ~7 seconds
          distanceInterval: 0 // or set to >0 to limit
        },
        (loc) => {
          handleLocationUpdate(loc);
        }
      );
      watchRef.current = subscriber;
      setIsTracking(true);
      // Also immediately fetch one snapshot
      const last = await Location.getLastKnownPositionAsync();
      if (last) handleLocationUpdate(last);
    } catch (err) {
      console.warn("Failed to start location watch:", err);
      Alert.alert("Error", "Could not start location tracking. Is GPS on?");
    }
  };

  // Stop tracking
  const stopTracking = async () => {
    try {
      if (watchRef.current) {
        watchRef.current.remove();
        watchRef.current = null;
      }
      setIsTracking(false);
      prevLocationRef.current = null;
    } catch (err) {
      console.warn("Error stopping tracking:", err);
    }
  };

  // Simple UI for starting/stopping, and showing permissions state
  return (
    <SafeAreaProvider>
      <PaperProvider theme={THEME}>
        <View style={styles.container}>
          <HeaderComponent
            driverId={driverId}
            onChangeDriverId={async (newId) => {
              setDriverId(newId);
              await AsyncStorage.setItem(STORAGE_KEYS.DRIVER_ID, newId);
            }}
          />

          {!hasPermission && hasPermission !== null ? (
            <View style={styles.center}>
              <Text>You must grant location permission for tracking.</Text>
              <Button
                mode="contained"
                onPress={async () => {
                  const { status } = await Location.requestForegroundPermissionsAsync();
                  setHasPermission(status === "granted");
                }}
              >
                Request Permission
              </Button>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.content}>
              <LocationCard location={location} />
              <StatsGrid session={sessionStats} />
              <ActivityLog items={activityLog} />

              <View style={styles.controls}>
                {isTracking ? (
                  <Button mode="contained" onPress={stopTracking}>
                    Stop Tracking
                  </Button>
                ) : (
                  <Button mode="contained" onPress={startTracking}>
                    Start Tracking
                  </Button>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8fb" },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  controls: { marginTop: 16, alignItems: "center", justifyContent: "center" }
});
=======
// // App.js
// import React from "react";
// import { NavigationContainer } from "@react-navigation/native";
// import { createStackNavigator } from "@react-navigation/stack";
// import { SafeAreaProvider } from "react-native-safe-area-context";
// import MapScreen from "./src/components/MapScreen";
// import SearchScreen from "./src/components/SearchScreen";         // create basic screens below
// import RouteDetailsScreen from "./src/components/RouteDetailsScreen";
// import DriverDetailScreen from "./src/components/DriverDetailScreen";

// const Stack = createStackNavigator();

// export default function App() {
//   return (
//     <SafeAreaProvider>
//       <NavigationContainer>
//         <Stack.Navigator initialRouteName="Home">
//           <Stack.Screen name="Home" component={MapScreen} options={{ title: "Nearby Buses" }} />
//           <Stack.Screen name="Search" component={SearchScreen} />
//           <Stack.Screen name="RouteDetails" component={RouteDetailsScreen} />
//           <Stack.Screen name="DriverDetail" component={DriverDetailScreen} options={{ title: "Driver" }} />
//         </Stack.Navigator>
//       </NavigationContainer>
//     </SafeAreaProvider>
//   );
// }



// App.js
import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

// Import screens
import MapScreen from "./src/components/MapScreen";
import SearchScreen from "./src/components/SearchScreen";
import RouteDetailsScreen from "./src/components/RouteDetailsScreen";
import DriverDetailScreen from "./src/components/DriverDetailScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#fff" />
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTintColor: '#333',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={MapScreen} 
            options={({ navigation }) => ({
              title: "Nearby Buses",
              headerRight: () => (
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Search')}
                  style={{ marginRight: 15 }}
                >
                  <Text style={{ color: '#2196F3', fontSize: 16 }}>Search</Text>
                </TouchableOpacity>
              ),
            })} 
          />
          <Stack.Screen 
            name="Search" 
            component={SearchScreen} 
            options={{ title: "Find Route" }}
          />
          <Stack.Screen 
            name="RouteDetails" 
            component={RouteDetailsScreen}
            options={{ title: "Route Details" }}
          />
          <Stack.Screen 
            name="DriverDetail" 
            component={DriverDetailScreen} 
            options={{ title: "Driver Details" }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
>>>>>>> b0a2188 (Initial commit)
