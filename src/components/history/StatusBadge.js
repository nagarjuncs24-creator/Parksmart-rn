import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getDisplayBookingStatus, STATUS_BADGE_STYLES } from '../../utils/bookingHelpers';

export default function StatusBadge({ booking, style }) {
  const label = getDisplayBookingStatus(booking);
  const palette = STATUS_BADGE_STYLES[label] || STATUS_BADGE_STYLES.Active;

  return (
    <View style={[styles.badge, { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor }, style]}>
      <Text style={[styles.text, { color: palette.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
