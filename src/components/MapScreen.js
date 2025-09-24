// // src/components/MapScreen.js
// import React, { useEffect, useState } from "react";
// import { View, StyleSheet, Platform } from "react-native";
// import MapView, { Marker, Callout } from "react-native-maps";
// import { subscribeToBuses } from "../services/firebaseService";

// export default function MapScreen({ navigation }) {
//   const [drivers, setDrivers] = useState({});

//   useEffect(() => {
//     const unsubscribe = subscribeToBuses((val) => {
//       setDrivers(val);
//     });
//     return () => unsubscribe();
//   }, []);

//   // default region (change to your city)
//   const initialRegion = {
//     latitude: 12.9716,
//     longitude: 77.5946,
//     latitudeDelta: 0.2,
//     longitudeDelta: 0.2,
//   };

//   return (
//     <View style={styles.container}>
//       <MapView
//         style={StyleSheet.absoluteFillObject}
//         provider="google"
//         initialRegion={initialRegion}
//         showsUserLocation={false}
//       >
//         {Object.entries(drivers).map(([driverId, data]) => {
//           if (!data || !data.lat || !data.lng) return null;
//           return (
//             <Marker
//               key={driverId}
//               coordinate={{ latitude: data.lat, longitude: data.lng }}
//               title={`Bus: ${driverId}`}
//             >
//               <Callout onPress={() => navigation?.navigate("DriverDetail", { driverId })}>
//                 {/* Simple callout content */}
//                 <View style={{ width: 200 }}>
//                   <View><Text>{`Driver: ${driverId}`}</Text></View>
//                   <View><Text>{`Speed: ${data.speed ?? 0} m/s`}</Text></View>
//                   <View><Text>{`Updated: ${new Date((data.timestamp||0)*1000).toLocaleTimeString()}`}</Text></View>
//                   <View><Text style={{color: 'blue'}}>Tap for details</Text></View>
//                 </View>
//               </Callout>
//             </Marker>
//           );
//         })}
//       </MapView>
//     </View>
//   );
// }

// import { Text } from "react-native";
// const styles = StyleSheet.create({
//   container: { flex: 1 },
// });


// src/components/MapScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { subscribeToBuses } from "../services/firebaseService";

export default function MapScreen({ navigation }) {
  const [drivers, setDrivers] = useState({});

  useEffect(() => {
    const unsubscribe = subscribeToBuses((val) => {
      console.log("Firebase data received:", val);
      setDrivers(val);
    });
    return () => unsubscribe();
  }, []);

  // Bangalore region (matching your screenshot)
  const initialRegion = {
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === 'android' ? 'google' : undefined}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        showsBuildings={true}
        showsTraffic={false}
        showsIndoors={true}
      >
        {Object.entries(drivers).map(([driverId, data]) => {
          if (!data || !data.lat || !data.lng) return null;
          return (
            <Marker
              key={driverId}
              coordinate={{ latitude: data.lat, longitude: data.lng }}
              title={`Bus: ${driverId}`}
              description={`Speed: ${data.speed ?? 0} m/s`}
            >
              <Callout onPress={() => navigation?.navigate("DriverDetail", { driverId })}>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{`Driver: ${driverId}`}</Text>
                  <Text style={styles.calloutText}>{`Speed: ${data.speed ?? 0} m/s`}</Text>
                  <Text style={styles.calloutText}>
                    {`Updated: ${new Date((data.timestamp || 0) * 1000).toLocaleTimeString()}`}
                  </Text>
                  <Text style={styles.calloutLink}>Tap for details</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  calloutContainer: {
    width: 200,
    padding: 10,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  calloutText: {
    fontSize: 14,
    marginBottom: 3,
  },
  calloutLink: {
    color: 'blue',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 5,
  },
});