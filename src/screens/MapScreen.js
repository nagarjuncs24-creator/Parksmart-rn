// import React, { useEffect, useMemo, useState } from 'react';
// import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, Alert, Linking, ScrollView } from 'react-native';
// import MapView, { Marker, Circle } from 'react-native-maps';
// import * as Location from 'expo-location';
// import { colors } from '../constants/theme';
// import {
//   getNearbyParkingAreas,
//   subscribeToParkingAreasRealtime,
//   getReports,
//   getUserFavorites,
//   updateUserFavorites,
// } from '../services/firestore';
// import { getCurrentUser } from '../services/auth';

// const filterDefinitions = [
//   { key: 'availableOnly', label: 'Available' },
//   { key: 'evSupport', label: 'EV' },
//   { key: 'largeVehicle', label: 'Large' },
// ];

// export default function MapScreen({ navigation }) {
//   const [parkingAreas, setParkingAreas] = useState([]);
//   const [location, setLocation] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [selectedArea, setSelectedArea] = useState(null);
//   const [activeFilters, setActiveFilters] = useState({ availableOnly: false, evSupport: false, largeVehicle: false });
//   const [sortKey, setSortKey] = useState('nearest');
//   const [nearestAreas, setNearestAreas] = useState([]);
//   const [favorites, setFavorites] = useState([]);

//   useEffect(() => {
//     requestLocationPermission();
//     const unsubscribe = subscribeToParkingAreasRealtime((areas) => {
//       setParkingAreas(areas);
//       setLoading(false);
//     });

//     const currentUser = getCurrentUser();
//     if (currentUser) {
//       getUserFavorites(currentUser.uid).then(setFavorites).catch(() => {});
//     }

//     return () => unsubscribe && unsubscribe();
//   }, []);

//   useEffect(() => {
//     if (!location || parkingAreas.length === 0) return;
//     refreshNearby();
//   }, [location, parkingAreas, activeFilters, sortKey]);

//   const requestLocationPermission = async () => {
//     try {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert('Location permission needed', 'Enable location to discover nearby parking.');
//         setLoading(false);
//         return;
//       }
//       const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
//       setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
//       setLoading(false);
//     } catch (error) {
//       Alert.alert('Location error', error.message);
//       setLoading(false);
//     }
//   };

//   const refreshNearby = async () => {
//     try {
//       const areas = await getNearbyParkingAreas(location.latitude, location.longitude, activeFilters);
//       const sorted = [...areas].sort((a, b) => {
//         if (sortKey === 'cheapest') return (a.pricePerHour || 0) - (b.pricePerHour || 0);
//         if (sortKey === 'available') return (b.availableSlots || 0) - (a.availableSlots || 0);
//         if (sortKey === 'nearest') return a.distanceKm - b.distanceKm;
//         return a.distanceKm - b.distanceKm;
//       });
//       setNearestAreas(sorted);
//     } catch (error) {
//       Alert.alert('Nearby parking error', error.message);
//     }
//   };

//   const toggleFavorite = async (areaId) => {
//     const currentUser = getCurrentUser();
//     if (!currentUser) {
//       Alert.alert('Login required', 'Please sign in to save favorites.');
//       return;
//     }
//     const nextFavorites = favorites.includes(areaId)
//       ? favorites.filter((id) => id !== areaId)
//       : [...favorites, areaId];
//     setFavorites(nextFavorites);
//     try {
//       await updateUserFavorites(currentUser.uid, nextFavorites);
//     } catch (error) {
//       Alert.alert('Favorites error', error.message);
//     }
//   };

//   const areaStatusColor = (area) => {
//     if (area.availableSlots === 0) return colors.danger;
//     if (area.reservedSlots > 0 || area.occupiedSlots > 0) return colors.warning;
//     return colors.success;
//   };

//   const openNavigation = (area) => {
//     const url = `https://www.google.com/maps/dir/?api=1&destination=${area.latitude},${area.longitude}&travelmode=driving`;
//     Linking.openURL(url).catch(() => {
//       Alert.alert('Navigation failed', 'Unable to open navigation app.');
//     });
//   };

//   const toggleFilter = (key) => {
//     setActiveFilters((prev) => ({ ...prev, [key]: !prev[key] }));
//   };

//   const recommendations = useMemo(() => {
//     if (nearestAreas.length === 0) return 'No nearby parking found.';
//     const best = nearestAreas[0];
//     if (best.availableSlots === 0) return 'Parking is busy right now. Try another area.';
//     if (best.pricePerHour <= 50) return `Best value: ${best.name} at ₹${best.pricePerHour}/hr.`;
//     return `Try ${best.name}: nearest and available.`;
//   }, [nearestAreas]);

//   if (loading) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color={colors.primary} />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.page}>
//       <MapView
//         style={styles.map}
//         region={location ? { ...location, latitudeDelta: 0.05, longitudeDelta: 0.05 } : undefined}
//         showsUserLocation
//       >
//         {parkingAreas.map((area) => (
//           <Marker
//             key={area.id}
//             coordinate={{ latitude: area.latitude, longitude: area.longitude }}
//             title={area.name}
//             description={`${area.availableSlots || 0}/${area.capacity || 0} available`}
//             pinColor={areaStatusColor(area)}
//             onPress={() => setSelectedArea(area)}
//           />
//         ))}
//         {location && <Circle center={location} radius={120} strokeColor={colors.primary} fillColor={`${colors.primary}22`} />}
//       </MapView>

//       <View style={styles.filterBar}>
//         <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
//           {filterDefinitions.map((filter) => (
//             <TouchableOpacity
//               key={filter.key}
//               style={[styles.filterChip, activeFilters[filter.key] && styles.filterChipActive]}
//               onPress={() => toggleFilter(filter.key)}
//             >
//               <Text style={[styles.filterText, activeFilters[filter.key] && styles.filterTextActive]}>{filter.label}</Text>
//             </TouchableOpacity>
//           ))}
//           {['nearest', 'cheapest', 'available'].map((key) => (
//             <TouchableOpacity
//               key={key}
//               style={[styles.filterChip, sortKey === key && styles.filterChipActive]}
//               onPress={() => setSortKey(key)}
//             >
//               <Text style={[styles.filterText, sortKey === key && styles.filterTextActive]}>{key}</Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>
//       </View>

//       <View style={styles.summaryCard}>
//         <Text style={styles.summaryLabel}>Nearby parking</Text>
//         <Text style={styles.summaryValue}>{recommendations}</Text>
//       </View>

//       <ScrollView style={styles.areaList} contentContainerStyle={styles.areaListContent}>
//         {nearestAreas.map((area) => (
//           <TouchableOpacity key={area.id} style={styles.areaCard} onPress={() => setSelectedArea(area)}>
//             <View style={styles.areaHeader}>
//               <Text style={styles.areaName}>{area.name}</Text>
//               <TouchableOpacity onPress={() => toggleFavorite(area.id)}>
//                 <Text style={[styles.favoriteIcon, favorites.includes(area.id) ? styles.favoriteActive : null]}>{favorites.includes(area.id) ? '★' : '☆'}</Text>
//               </TouchableOpacity>
//               <View style={[styles.statusBadge, { backgroundColor: areaStatusColor(area) }]}>
//                 <Text style={styles.statusBadgeText}>{area.availableSlots > 0 ? 'Available' : 'Full'}</Text>
//               </View>
//             </View>
//             <Text style={styles.areaSub}>{area.distanceKm?.toFixed(1)} km away · ₹{area.pricePerHour}/hr</Text>
//             <View style={styles.areaMetaRow}>
//               <Text style={styles.areaMeta}>{area.capacity || 0} slots</Text>
//               {area.evSupport && <Text style={styles.areaMeta}>EV</Text>}
//               {area.largeVehicle && <Text style={styles.areaMeta}>Large</Text>}
//             </View>
//             <TouchableOpacity style={styles.navigateButton} onPress={() => openNavigation(area)}>
//               <Text style={styles.navigateText}>Navigate</Text>
//             </TouchableOpacity>
//           </TouchableOpacity>
//         ))}
//       </ScrollView>

//       {selectedArea && (
//         <View style={styles.detailTray}>
//           <Text style={styles.detailTitle}>{selectedArea.name}</Text>
//           <Text style={styles.detailDescription}>{selectedArea.description || 'Smart city parking area with live slot updates.'}</Text>
//           <View style={styles.detailRow}>
//             <Text style={styles.detailLabel}>Capacity</Text>
//             <Text style={styles.detailValue}>{selectedArea.capacity || 'N/A'}</Text>
//           </View>
//           <View style={styles.detailRow}>
//             <Text style={styles.detailLabel}>Price</Text>
//             <Text style={styles.detailValue}>₹{selectedArea.pricePerHour}/hr</Text>
//           </View>
//           <TouchableOpacity style={styles.actionButton} onPress={() => openNavigation(selectedArea)}>
//             <Text style={styles.actionText}>Open in Maps</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   page: { flex: 1, backgroundColor: colors.background },
//   map: { flex: 1 },
//   centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
//   filterBar: { position: 'absolute', top: 24, left: 0, right: 0, paddingHorizontal: 12 },
//   filterScroll: { alignItems: 'center' },
//   filterChip: {
//     paddingVertical: 8,
//     paddingHorizontal: 14,
//     borderRadius: 18,
//     backgroundColor: colors.panel,
//     marginRight: 10,
//     borderWidth: 1,
//     borderColor: colors.border,
//   },
//   filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
//   filterText: { color: colors.text, fontWeight: '700' },
//   filterTextActive: { color: '#fff' },
//   summaryCard: {
//     position: 'absolute',
//     top: 90,
//     left: 12,
//     right: 12,
//     padding: 16,
//     borderRadius: 20,
//     backgroundColor: colors.panel,
//     borderWidth: 1,
//     borderColor: colors.border,
//   },
//   summaryLabel: { fontSize: 12, color: colors.secondaryText, marginBottom: 6, fontWeight: '700' },
//   summaryValue: { fontSize: 15, color: colors.text, fontWeight: '700' },
//   areaList: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '46%' },
//   areaListContent: { paddingBottom: 24 },
//   areaCard: {
//     backgroundColor: colors.panel,
//     borderRadius: 20,
//     padding: 16,
//     marginHorizontal: 12,
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: colors.border,
//   },
//   areaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
//   areaName: { fontSize: 16, fontWeight: '800', color: colors.text },
//   favoriteIcon: { fontSize: 20, marginLeft: 8 },
//   favoriteActive: { color: '#FFD700' },
//   areaSub: { fontSize: 13, color: colors.secondaryText, marginBottom: 10 },
//   areaMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
//   areaMeta: { fontSize: 12, color: colors.secondaryText, marginRight: 12 },
//   statusBadge: { borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
//   statusBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
//   navigateButton: { marginTop: 8, backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
import { ErrorBoundary } from '../utils/ErrorBoundary';
//   navigateText: { color: '#fff', fontSize: 14, fontWeight: '700' },
const FALLBACK_COORDS = { latitude: 12.9716, longitude: 77.5946 };

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        if (Platform.OS === 'web') {
          console.log('Map: running on web — map is disabled');
          setLoading(false);
          return;
        }
        console.log('Map: requesting location permission');
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('Map: permission status', status);
        if (status !== 'granted') {
          Alert.alert('Location permission needed', 'Enable location to view the map.');
          setLoading(false);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        console.log('Map: got position', pos.coords);
        if (!mounted) return;
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } catch (err) {
        console.error('Map init error', err);
        setMapError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.centered}>
        <Text>Maps are disabled on web for the MVP.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12 }}>Loading map…</Text>
      </View>
    );
  }

  if (mapError) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.danger, fontWeight: '700' }}>Map loading failed</Text>
        <Text style={{ marginTop: 8 }}>{mapError}</Text>
      </View>
    );
  }

  const initialRegion = location
    ? { ...location, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : { ...FALLBACK_COORDS, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  const markerCoord = location || FALLBACK_COORDS;

  return (
    <ErrorBoundary>
      <View style={styles.page}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={true}
          onMapReady={() => console.log('Map: ready')}
          onLayout={() => console.log('Map: layout')}
          onError={(e) => { console.error('Map error', e); setMapError(e?.nativeEvent?.message || 'Map render error'); }}
        >
          <Marker coordinate={markerCoord} title="Parking" description="Sample parking marker" />
        </MapView>
      </View>
    </ErrorBoundary>
  );
//       return 'red';
//     }

//     if (area.reservedSlots > 0 || area.occupiedSlots > 0) {
//       return 'orange';
//     }

//     return 'green';
//   };

//   const openNavigation = (area) => {
//     const url = `https://www.google.com/maps/dir/?api=1&destination=${area.latitude},${area.longitude}`;

//     Linking.openURL(url).catch(() => {
//       Alert.alert('Unable to open navigation');
//     });
//   };

//   const toggleFilter = (key) => {
//     setActiveFilters((prev) => ({
//       ...prev,
//       [key]: !prev[key],
//     }));
//   };

//   const recommendations = useMemo(() => {
//     if (nearestAreas.length === 0) {
//       return 'No nearby parking found';
//     }

//     const best = nearestAreas[0];

//     if (best.availableSlots === 0) {
//       return 'Parking is crowded nearby';
//     }

//     return `${best.name} has ${best.availableSlots} slots available`;
//   }, [nearestAreas]);

//   if (loading) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color={colors.primary} />
//         <Text style={{ marginTop: 10 }}>Loading Map...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.page}>
//       <MapView
//         style={styles.map}
//         showsUserLocation
//         initialRegion={{
//           latitude: location?.latitude || 12.9716,
//           longitude: location?.longitude || 77.5946,
//           latitudeDelta: 0.05,
//           longitudeDelta: 0.05,
//         }}
//       >
//         {parkingAreas.map((area) => (
//           <Marker
//             key={area.id}
//             coordinate={{
//               latitude: area.latitude,
//               longitude: area.longitude,
//             }}
//             title={area.name}
//             description={`${area.availableSlots || 0} slots available`}
//             pinColor={areaStatusColor(area)}
//             onPress={() => setSelectedArea(area)}
//           />
//         ))}

//         {location && (
//           <Circle
//             center={location}
//             radius={120}
//             strokeColor="rgba(0,122,255,0.5)"
//             fillColor="rgba(0,122,255,0.2)"
//           />
//         )}
//       </MapView>

//       <View style={styles.filterBar}>
//         <ScrollView
//           horizontal
//           showsHorizontalScrollIndicator={false}
//         >
//           {filterDefinitions.map((filter) => (
//             <TouchableOpacity
//               key={filter.key}
//               style={[
//                 styles.filterChip,
//                 activeFilters[filter.key] &&
//                   styles.filterChipActive,
//               ]}
//               onPress={() => toggleFilter(filter.key)}
//             >
//               <Text style={styles.filterText}>
//                 {filter.label}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>
//       </View>

//       <View style={styles.summaryCard}>
//         <Text style={styles.summaryText}>
//           {recommendations}
//         </Text>
//       </View>

//       <ScrollView
//         style={styles.areaList}
//         contentContainerStyle={{ paddingBottom: 20 }}
//       >
//         {nearestAreas.map((area) => (
//           <View key={area.id} style={styles.areaCard}>
//             <Text style={styles.areaName}>
//               {area.name}
//             </Text>

//             <Text style={styles.areaSub}>
//               ₹{area.pricePerHour}/hr •{' '}
//               {area.distanceKm?.toFixed(1)} km
//             </Text>

//             <Text style={styles.areaSub}>
//               {area.availableSlots} slots available
//             </Text>

//             <TouchableOpacity
//               style={styles.navigateButton}
//               onPress={() => openNavigation(area)}
//             >
//               <Text style={styles.navigateText}>
//                 Navigate
//               </Text>
//             </TouchableOpacity>
//           </View>
//         ))}
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   page: {
//     flex: 1,
//     backgroundColor: colors.background,
//   },

//   map: {
//     width: '100%',
//     height: '100%',
//   },

//   centered: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   filterBar: {
//     position: 'absolute',
//     top: 20,
//     left: 10,
//     right: 10,
//   },

//   filterChip: {
//     backgroundColor: '#fff',
//     paddingVertical: 8,
//     paddingHorizontal: 14,
//     borderRadius: 20,
//     marginRight: 10,
//   },

//   filterChipActive: {
//     backgroundColor: colors.primary,
//   },

//   filterText: {
//     fontWeight: '700',
//   },

//   summaryCard: {
//     position: 'absolute',
//     top: 80,
//     left: 12,
//     right: 12,
//     backgroundColor: '#fff',
//     padding: 15,
//     borderRadius: 18,
//   },

//   summaryText: {
//     fontSize: 14,
//     fontWeight: '700',
//   },

//   areaList: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     maxHeight: '40%',
//   },

//   areaCard: {
//     backgroundColor: '#fff',
//     marginHorizontal: 12,
//     marginBottom: 12,
//     padding: 16,
//     borderRadius: 18,
//   },

//   areaName: {
//     fontSize: 16,
//     fontWeight: '800',
//   },

//   areaSub: {
//     marginTop: 6,
//     color: '#666',
//   },

//   navigateButton: {
//     marginTop: 12,
//     backgroundColor: colors.primary,
//     paddingVertical: 12,
//     borderRadius: 14,
//     alignItems: 'center',
//   },

//   navigateText: {
//     color: '#fff',
//     fontWeight: '700',
//   },
// });







import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView from 'react-native-maps';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 12.9716,
          longitude: 77.5946,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      />

      <View style={styles.overlay}>
        <Text style={styles.text}>Map Working</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  overlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
  },

  text: {
    fontWeight: 'bold',
  },
});
