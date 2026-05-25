import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../constants/theme';
import StatCard from '../components/StatCard';
import ActionCard from '../components/ActionCard';
import PredictionCard from '../components/PredictionCard';
import { getCurrentUser } from '../services/auth';
import { getUserById, subscribeToSlotsRealtime, checkAdminAccess } from '../services/firestore';
import { getTrafficPrediction } from '../services/predictions';

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState('Driver');
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [bookedCount, setBookedCount] = useState(0);
  const [nearbyAreas, setNearbyAreas] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [prediction, setPrediction] = useState(getTrafficPrediction([]));

  useEffect(() => {
    const currentUser = getCurrentUser();

    async function loadUser() {
      if (!currentUser) return;
      const userDoc = await getUserById(currentUser.uid);
      setUserName(userDoc?.name || currentUser.email || 'Driver');
      const adminAccess = await checkAdminAccess(currentUser.email);
      setIsAdmin(adminAccess);
    }

    loadUser();

    const unsubscribe = subscribeToSlotsRealtime((slotData) => {
      setSlots(slotData);
      setLoading(false);
      const available = slotData.filter((item) => item.status === 'available').length;
      const occupied = slotData.filter((item) => item.status !== 'available').length;
      setAvailableCount(available);
      setBookedCount(occupied);
      setPrediction(getTrafficPrediction(slotData));

      const areaMap = slotData.reduce((acc, slot) => {
        const area = slot.parkingArea || 'City Center';
        if (!acc[area]) {
          acc[area] = { area, count: 0, available: 0 };
        }
        acc[area].count += 1;
        if (slot.status === 'available') acc[area].available += 1;
        return acc;
      }, {});

      setNearbyAreas(Object.values(areaMap).slice(0, 2));
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {userName}</Text>
        <Text style={styles.headline}>Your smart parking dashboard is ready.</Text>
      </View>

      <PredictionCard {...prediction} />

      <View style={styles.statRow}>
        <StatCard label="Available" value={availableCount.toString()} accent={colors.success} />
        <StatCard label="Occupied" value={bookedCount.toString()} accent={colors.danger} />
      </View>

      <View style={styles.statRow}>
        <StatCard label="Total slots" value={slots.length.toString()} accent={colors.primary} />
        <StatCard label="Areas" value={nearbyAreas.length.toString()} accent={colors.secondaryText} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.actionRow}>
          <ActionCard title="Book Slot" subtitle="Reserve parking now" onPress={() => navigation.navigate('Booking')} color="#E8F8F0" />
          <ActionCard title="History" subtitle="View your bookings" onPress={() => navigation.navigate('History')} color="#FEF4E6" />
        </View>
        <View style={styles.actionRow}>
          <ActionCard title="Profile" subtitle="Manage your account" onPress={() => navigation.navigate('Profile')} color="#F3F7FF" />
          {isAdmin && (
            <ActionCard title="Admin" subtitle="Manage slots and bookings" onPress={() => navigation.navigate('AdminDashboard')} color="#F9F5FF" />
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nearby parking</Text>
        <View style={styles.nearbyRow}>
          {nearbyAreas.length > 0 ? (
            nearbyAreas.map((spot) => (
              <View key={spot.area} style={styles.smallCard}>
                <Text style={styles.smallTitle}>{spot.area}</Text>
                <Text style={styles.smallText}>{spot.count} slots</Text>
                <Text style={styles.smallText}>{spot.available} available</Text>
              </View>
            ))
          ) : (
            <View style={styles.smallCard}>
              <Text style={styles.smallTitle}>No nearby data</Text>
              <Text style={styles.smallText}>Add slots in Firestore to see nearby parking.</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Smart Parking Dashboard</Text>
        <Text style={styles.infoText}>Track real parking availability and manage bookings with live data.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  headline: {
    fontSize: 15,
    color: colors.secondaryText,
    lineHeight: 22,
    maxWidth: '90%',
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 14,
  },
  nearbyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallCard: {
    backgroundColor: colors.panel,
    borderRadius: 18,
    padding: 18,
    width: '48%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  smallText: {
    fontSize: 13,
    color: colors.secondaryText,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoCard: {
    marginTop: 4,
    padding: 20,
    borderRadius: 22,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.secondaryText,
    lineHeight: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
