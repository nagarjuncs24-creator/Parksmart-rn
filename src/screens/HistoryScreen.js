import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { getCurrentUser } from '../services/auth';
import { subscribeToUserBookingsRealtime, subscribeToUserNotificationsRealtime } from '../services/firestore';
import BookingTimelineCard from '../components/history/BookingTimelineCard';
import UserAnalyticsBar from '../components/history/UserAnalyticsBar';
import { computeUserHistoryAnalytics } from '../utils/bookingHelpers';

export default function HistoryScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const analytics = useMemo(() => computeUserHistoryAnalytics(bookings), [bookings]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      setBookings([]);
      setLoading(false);
      return;
    }

    const unsubBookings = subscribeToUserBookingsRealtime(currentUser.uid, (data) => {
      setBookings(data);
      setLoading(false);
    });

    const unsubNotifications = subscribeToUserNotificationsRealtime(currentUser.uid, (items) => {
      setUnreadCount(items.filter((n) => !n.read).length);
    });

    return () => {
      unsubBookings();
      unsubNotifications();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading booking history…</Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
        <Text style={styles.heading}>Booking History</Text>
        <Pressable style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color={colors.primaryDark} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <UserAnalyticsBar analytics={analytics} />

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <BookingTimelineCard
            booking={item}
            index={index}
            onPress={(booking) => navigation.navigate('BookingDetails', { bookingId: booking.id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="document-text-outline" size={48} color={colors.border} />
            <Text style={styles.empty}>No bookings yet. Reserve a slot from the Booking tab.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.panel,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  list: {
    paddingBottom: 40,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 48,
    paddingHorizontal: 24,
  },
  empty: {
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 15,
    lineHeight: 22,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: colors.secondaryText,
  },
});
