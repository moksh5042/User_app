// import React, { useEffect, useState } from "react";
// import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet } from "react-native";
// import { subscribeToBuses } from "../services/firebaseService";

// export default function SearchScreen({ navigation }) {
//   const [drivers, setDrivers] = useState({});
//   const [query, setQuery] = useState("");

//   useEffect(() => {
//     const unsub = subscribeToBuses(setDrivers);
//     return () => unsub();
//   }, []);

//   const filtered = Object.entries(drivers).filter(([driverId]) =>
//     driverId.toLowerCase().includes(query.toLowerCase())
//   );

//   return (
//     <View style={styles.container}>
//       <TextInput
//         placeholder="Search by Driver ID"
//         value={query}
//         onChangeText={setQuery}
//         style={styles.input}
//       />
//       <FlatList
//         data={filtered}
//         keyExtractor={([driverId]) => driverId}
//         renderItem={({ item: [driverId, data] }) => (
//           <TouchableOpacity
//             style={styles.card}
//             onPress={() => navigation.navigate("DriverDetail", { driverId })}
//           >
//             <Text style={styles.title}>{driverId}</Text>
//             <Text>{`Lat: ${data.lat?.toFixed(3)} | Lng: ${data.lng?.toFixed(3)}`}</Text>
//           </TouchableOpacity>
//         )}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 16 },
//   input: { borderWidth: 1, borderColor: "#ccc", padding: 8, marginBottom: 12, borderRadius: 6 },
//   card: { padding: 12, borderBottomWidth: 1, borderColor: "#eee" },
//   title: { fontWeight: "bold", fontSize: 16 },
// });


import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SearchScreen = ({ navigation }) => {
  const [fromStop, setFromStop] = useState('');
  const [toStop, setToStop] = useState('');
  const [showFromModal, setShowFromModal] = useState(false);
  const [showToModal, setShowToModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Bus stops data
  const busStops = [
    'Main Bus Station',
    'City Center Mall',
    'University Gate',
    'Hospital Junction',
    'Railway Station',
    'Airport Road',
    'Industrial Area',
    'Sports Complex',
    'Shopping Plaza',
    'Government Office',
  ];

  // Mock route data
  const mockRoutes = {
    'Railway Station-Sports Complex': [
      {
        id: 1,
        routes: [
          { name: 'Route 1 - City Center', color: '#FF6B35', transfer: 'Main Bus Station' },
          { name: 'Route 2 - University', color: '#4A90E2', transfer: null }
        ]
      },
      {
        id: 2,
        routes: [
          { name: 'Route 1 - City Center', color: '#FF6B35', transfer: 'Main Bus Station' },
          { name: 'Route 4 - Airport', color: '#8E44AD', transfer: null }
        ]
      }
    ]
  };

  const handleFromSelect = (stop) => {
    setFromStop(stop);
    setShowFromModal(false);
  };

  const handleToSelect = (stop) => {
    setToStop(stop);
    setShowToModal(false);
  };

  const searchRoutes = () => {
    if (fromStop && toStop) {
      const routeKey = `${fromStop}-${toStop}`;
      const results = mockRoutes[routeKey] || [];
      setSearchResults(results);
    }
  };

  const swapStops = () => {
    const temp = fromStop;
    setFromStop(toStop);
    setToStop(temp);
  };

  const renderStopModal = (visible, onClose, onSelect, title) => (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView>
            {busStops.map((stop, index) => (
              <TouchableOpacity
                key={index}
                style={styles.stopItem}
                onPress={() => onSelect(stop)}
              >
                <Text style={styles.stopText}>{stop}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderRouteResult = (routeGroup, index) => (
    <View key={index} style={styles.routeCard}>
      {routeGroup.routes.map((route, routeIndex) => (
        <View key={routeIndex} style={styles.routeItem}>
          <View style={[styles.routeIndicator, { backgroundColor: route.color }]} />
          <View style={styles.routeInfo}>
            <Text style={styles.routeName}>{route.name}</Text>
            {route.transfer && (
              <Text style={styles.transferText}>Transfer at {route.transfer}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* From Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>From</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowFromModal(true)}
        >
          <Text style={[styles.dropdownText, !fromStop && styles.placeholder]}>
            {fromStop || 'Select source stop'}
          </Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* To Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>To</Text>
        <View style={styles.toContainer}>
          <TouchableOpacity
            style={styles.dropdownWithSwap}
            onPress={() => setShowToModal(true)}
          >
            <Text style={[styles.dropdownText, !toStop && styles.placeholder]}>
              {toStop || 'Select destination stop'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.swapButton} onPress={swapStops}>
            <View style={styles.swapIcon}>
              <Text style={styles.swapText}>⇅</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Button */}
      <TouchableOpacity style={styles.searchButton} onPress={searchRoutes}>
        <Text style={styles.searchButtonText}>Search Routes</Text>
      </TouchableOpacity>

      {/* Results */}
      {searchResults.length > 0 && (
        <ScrollView style={styles.resultsContainer}>
          {searchResults.map((routeGroup, index) => renderRouteResult(routeGroup, index))}
        </ScrollView>
      )}

      {/* Modals */}
      {renderStopModal(
        showFromModal,
        () => setShowFromModal(false),
        handleFromSelect,
        'Select source stop'
      )}
      
      {renderStopModal(
        showToModal,
        () => setShowToModal(false),
        handleToSelect,
        'Select destination stop'
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropdownWithSwap: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    color: '#999',
  },
  dropdownArrow: {
    color: '#666',
    fontSize: 12,
  },
  toContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swapButton: {
    marginLeft: 10,
  },
  swapIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#e0e0e0',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swapText: {
    fontSize: 20,
    color: '#666',
  },
  searchButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transferText: {
    fontSize: 14,
    color: '#FF9500',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'left',
  },
  stopItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stopText: {
    fontSize: 16,
    color: '#333',
  },
});

export default SearchScreen;
