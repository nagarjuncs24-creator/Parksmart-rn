import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { getCurrentUser } from '../services/auth';
import { subscribeToUserNotificationsRealtime, markNotificationRead } from '../services/firestore';
import { parseTimestamp } from '../utils/profileFormat';

const TYPE_ICONS = {
  booking_confirmed: 'checkmark-circle',
  slot_reserved: 'bookmark',
  payment_success: 'card',
  booking_expiring: 'alarm',
  slot_released: 'exit',
};

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserNotificationsRealtime(user.uid, (items) => {
      setNotifications(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePress = async (item) => {
    if (!item.read) {
      await markNotificationRead(item.id).catch(() => {});
    }
    if (item.bookingId) {
      navigation.navigate('BookingDetails', { bookingId: item.bookingId });
    }
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
      <Pressable style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <Text style={styles.heading}>Notifications</Text>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No notifications yet.</Text>}
        renderItem={({ item }) => {
          const icon = TYPE_ICONS[item.type] || 'notifications';
          const date = parseTimestamp(item.createdAt);
          return (
            <Pressable
              style={[styles.card, !item.read && styles.unread]}
              onPress={() => handlePress(item)}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={icon} size={22} color={colors.primaryDark} />
              </View>
              <View style={styles.body}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.bodyText}>{item.body}</Text>
                <Text style={styles.time}>
                  {date ? date.toLocaleString() : ''}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background, padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  backText: { fontSize: 16, fontWeight: '600' },
  heading: { fontSize: 26, fontWeight: '800', marginBottom: 16, color: colors.text },
  list: { paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.panel,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unread: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '800', color: colors.text },
  bodyText: { fontSize: 13, color: colors.secondaryText, marginTop: 4, lineHeight: 18 },
  time: { fontSize: 11, color: colors.secondaryText, marginTop: 8 },
  empty: { textAlign: 'center', color: colors.secondaryText, marginTop: 40 },
});
