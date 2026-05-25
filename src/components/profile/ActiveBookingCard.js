import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { getBookingAreaName, getBookingSlotName } from '../../utils/profileStats';
import { formatCountdown } from '../../utils/profileFormat';

export default function ActiveBookingCard({ booking, slot, countdown, onNavigate, onViewTicket }) {
  if (!booking) return null;

  const area = getBookingAreaName(booking);
  const slotName = getBookingSlotName(booking) !== '—' ? getBookingSlotName(booking) : slot?.slotName || slot?.slotId || '—';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Ionicons name="flash" size={14} color="#fff" />
          <Text style={styles.badgeText}>Active booking</Text>
        </View>
        {countdown !== null && (
          <Text style={styles.timer}>{formatCountdown(countdown)} left</Text>
        )}
      </View>

      <View style={styles.row}>
        <Ionicons name="location-outline" size={18} color={colors.primaryDark} />
        <Text style={styles.rowText}>{area}</Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="grid-outline" size={18} color={colors.primaryDark} />
        <Text style={styles.rowText}>Slot {slotName}</Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="cash-outline" size={18} color={colors.primaryDark} />
        <Text style={styles.rowText}>₹{booking.totalPrice || 0} predicted</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.secondaryBtn} onPress={onNavigate}>
          <Ionicons name="navigate" size={16} color={colors.primaryDark} />
          <Text style={styles.secondaryText}>Navigate</Text>
        </Pressable>
        <Pressable style={styles.primaryBtn} onPress={onViewTicket}>
          <Text style={styles.primaryText}>View ticket</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primaryLight,
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  timer: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  rowText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.panel,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
  },
});
