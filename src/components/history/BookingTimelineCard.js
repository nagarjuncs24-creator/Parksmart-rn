import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import StatusBadge from './StatusBadge';
import { getBookingAreaName, getBookingSlotName } from '../../utils/profileStats';
import {
  formatDateOnly,
  formatTimeOnly,
  getBookingStartTime,
  getBookingEndTime,
} from '../../utils/bookingHelpers';
import { formatDurationLabel } from '../../utils/profileFormat';

export default function BookingTimelineCard({ booking, index, onPress }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, friction: 8, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, [index, opacity, translateX]);

  const start = getBookingStartTime(booking);
  const end = getBookingEndTime(booking);
  const paymentStatus = (booking.paymentStatus || 'pending').toString();

  return (
    <Pressable onPress={() => onPress(booking)}>
      <Animated.View style={[styles.row, { opacity, transform: [{ translateX }] }]}>
        <View style={styles.timeline}>
          <View style={styles.dot} />
          <View style={styles.line} />
        </View>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.area}>{getBookingAreaName(booking)}</Text>
              <Text style={styles.slot}>Slot {getBookingSlotName(booking)}</Text>
            </View>
            <StatusBadge booking={booking} />
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.secondaryText} />
            <Text style={styles.meta}>{formatDateOnly(start)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color={colors.secondaryText} />
            <Text style={styles.meta}>
              {formatTimeOnly(start)} – {formatTimeOnly(end)} · {formatDurationLabel(booking.durationHours)}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="card-outline" size={14} color={colors.secondaryText} />
            <Text style={styles.meta}>Payment: {paymentStatus}</Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.amount}>₹{booking.totalPrice || 0}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  timeline: {
    width: 24,
    alignItems: 'center',
    marginRight: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginTop: 18,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  card: {
    flex: 1,
    backgroundColor: colors.panel,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#1F8A4C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  meta: {
    fontSize: 13,
    color: colors.secondaryText,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  amount: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryDark,
  },
});
