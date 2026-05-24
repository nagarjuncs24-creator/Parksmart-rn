import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { getBookingAreaName, getBookingSlotName, getBookingStatus } from '../../utils/profileStats';
import { formatBookingDate, formatDurationLabel } from '../../utils/profileFormat';

const statusColors = {
  active: colors.primary,
  completed: colors.success,
  cancelled: colors.danger,
  reserved: colors.warning,
  occupied: colors.primaryDark,
  entered: '#8A67FF',
};

export default function BookingHistoryItem({ booking }) {
  const status = getBookingStatus(booking);
  const accent = statusColors[status] || colors.secondaryText;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.area}>{getBookingAreaName(booking)}</Text>
          <Text style={styles.slot}>Slot {getBookingSlotName(booking)}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: `${accent}22` }]}>
          <Text style={[styles.status, { color: accent }]}>{status}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={14} color={colors.secondaryText} />
        <Text style={styles.meta}>{formatBookingDate(booking.bookingTime || booking.createdAt)}</Text>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={14} color={colors.secondaryText} />
        <Text style={styles.meta}>{formatDurationLabel(booking.durationHours)}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.amount}>₹{booking.totalPrice || 0}</Text>
        <Text style={styles.paidLabel}>paid</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  area: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  slot: {
    fontSize: 14,
    color: colors.secondaryText,
    marginTop: 2,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  meta: {
    fontSize: 13,
    color: colors.secondaryText,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
    gap: 6,
  },
  amount: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  paidLabel: {
    fontSize: 12,
    color: colors.secondaryText,
    fontWeight: '600',
  },
});
