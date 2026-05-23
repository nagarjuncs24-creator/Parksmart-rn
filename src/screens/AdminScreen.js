import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { colors } from '../constants/theme';
import { getCurrentUser } from '../services/auth';
import {
  createSlot,
  removeSlot,
  updateSlotStatus,
  getParkingStats,
  checkAdminAccess,
  subscribeToSlotsRealtime,
  subscribeToBookingsRealtime,
  subscribeToUsersRealtime,
} from '../services/firestore';
import StatCard from '../components/StatCard';

export default function AdminScreen({ navigation }) {
  const [slots, setSlots] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    availableSlots: 0,
    occupiedSlots: 0,
    peakBookingHour: 'No bookings yet',
    peakBookingCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [adminReady, setAdminReady] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      return;
    }

    const verifyAdmin = async () => {
      try {
        const isAdmin = await checkAdminAccess(currentUser.email);
        if (!isAdmin) {
          navigation.replace('AccessDenied');
          return;
        }
        setAdminReady(true);
      } catch (error) {
        Alert.alert('Access error', error.message);
      }
    };
    verifyAdmin();
  }, [navigation]);

  useEffect(() => {
    if (!adminReady) return;

    setLoading(true);
    const unsubscribeSlots = subscribeToSlotsRealtime((slotList) => {
      setSlots(slotList);
    });
    const unsubscribeBookings = subscribeToBookingsRealtime((bookingList) => {
      setBookings(bookingList);
    });
    const unsubscribeUsers = subscribeToUsersRealtime((userList) => {
      setUsers(userList);
    });

    const loadStats = async () => {
      try {
        const result = await getParkingStats();
        setStats(result);
      } catch (error) {
        Alert.alert('Unable to load stats', error.message);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    return () => {
      unsubscribeSlots();
      unsubscribeBookings();
      unsubscribeUsers();
    };
  }, [adminReady]);

  const handleAddSlot = async () => {
    const slotId = `slot-${Date.now()}`;
    try {
      await createSlot({ slotId, status: 'available', parkingArea: 'Campus Lot' });
      Alert.alert('Slot added', `New slot ${slotId} has been created.`);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleToggleStatus = async (slot) => {
    try {
      const nextStatus = slot.status === 'available' ? 'occupied' : 'available';
      await updateSlotStatus(slot.id, nextStatus);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    Alert.alert('Delete slot', 'Remove this slot from inventory?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeSlot(slotId);
          } catch (error) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  if (!adminReady || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Admin Dashboard</Text>

      <View style={styles.summaryRow}>
        <StatCard label="Users" value={stats.totalUsers.toString()} accent={colors.primary} />
        <StatCard label="Bookings" value={stats.totalBookings.toString()} accent={colors.success} />
        <StatCard label="Available" value={stats.availableSlots.toString()} accent={colors.success} />
      </View>

      <View style={styles.summaryRow}>
        <StatCard label="Occupied" value={stats.occupiedSlots.toString()} accent={colors.danger} />
        <StatCard label="Peak hour" value={stats.peakBookingHour} accent={colors.warning} />
      </View>

      <Pressable style={styles.addButton} onPress={handleAddSlot}>
        <Text style={styles.addButtonText}>Add parking slot</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Active slots</Text>
      <FlatList
        data={slots}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.slotId || item.id}</Text>
            <Text style={styles.cardMeta}>{item.parkingArea || 'Unknown area'}</Text>
            <Text style={styles.cardText}>Status: {item.status}</Text>
            <View style={styles.buttonRow}>
              <Pressable style={styles.actionButton} onPress={() => handleToggleStatus(item)}>
                <Text style={styles.actionText}>{item.status === 'available' ? 'Mark occupied' : 'Mark free'}</Text>
              </Pressable>
              <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDeleteSlot(item.id)}>
                <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <Text style={styles.sectionTitle}>Latest bookings</Text>
      {bookings.length === 0 ? (
        <Text style={styles.emptyText}>No bookings yet. Create a booking to see them here.</Text>
      ) : (
        bookings.slice(0, 4).map((booking) => (
          <View key={booking.id} style={styles.bookingCard}>
            <Text style={styles.cardTitle}>{booking.slotId}</Text>
            <Text style={styles.cardText}>User: {booking.userId}</Text>
            <Text style={styles.cardText}>Status: {booking.status}</Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Users</Text>
      {users.length === 0 ? (
        <Text style={styles.emptyText}>No users yet.</Text>
      ) : (
        users.slice(0, 4).map((user) => (
          <View key={user.uid} style={styles.bookingCard}>
            <Text style={styles.cardTitle}>{user.name || 'Unnamed'}</Text>
            <Text style={styles.cardText}>{user.email}</Text>
            <Text style={styles.cardText}>Role: {user.role || 'user'}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: colors.panel,
    borderRadius: 18,
    padding: 18,
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 8,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 22,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  list: {
    paddingBottom: 10,
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookingCard: {
    backgroundColor: colors.panel,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  cardMeta: {
    fontSize: 13,
    color: colors.secondaryText,
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    color: colors.secondaryText,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#F8D7DA',
    marginRight: 0,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
  },
  deleteText: {
    color: colors.danger,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
