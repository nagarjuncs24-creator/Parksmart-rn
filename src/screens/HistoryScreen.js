import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { colors } from '../constants/theme';
import { getCurrentUser } from '../services/auth';
import { getUserBookings } from '../services/firestore';

export default function HistoryScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookings = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setBookings([]);
        setLoading(false);
        return;
      }

      try {
        const data = await getUserBookings(currentUser.uid);
        setBookings(data);
      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, []);

  const formatBookingDate = (booking) => {
    const timestamp = booking.bookingTime || booking.createdAt;
    if (!timestamp) return 'Unknown date';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <Text style={styles.heading}>Booking History</Text>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.slotId}</Text>
            <Text style={styles.cardText}>{formatBookingDate(item)}</Text>
            <Text style={styles.cardText}>Duration: {item.durationHours || 1} hr</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardAmount}>₹{item.totalPrice || '0'}</Text>
              <Text style={styles.cardStatus}>{item.status || 'active'}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No booking history yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 18,
  },
  list: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  cardText: {
    fontSize: 14,
    color: colors.secondaryText,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardAmount: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '700',
  },
  cardStatus: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  empty: {
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
