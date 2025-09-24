import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function RouteDetailsScreen({ route }) {
  const { routeId } = route.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Route Details</Text>
      <Text>{routeId ? `Showing details for route: ${routeId}` : "No route selected."}</Text>
      {/* TODO: Fetch route data from Firebase if available */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
});
