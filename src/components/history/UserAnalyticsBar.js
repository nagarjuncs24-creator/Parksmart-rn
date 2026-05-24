import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

export default function UserAnalyticsBar({ analytics }) {
  if (!analytics) return null;

  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <Ionicons name="wallet-outline" size={20} color={colors.primary} />
        <Text style={styles.value}>₹{analytics.totalSpent}</Text>
        <Text style={styles.label}>Total spent</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.item}>
        <Ionicons name="location-outline" size={20} color={colors.primary} />
        <Text style={styles.value} numberOfLines={1}>
          {analytics.mostUsedArea}
        </Text>
        <Text style={styles.label}>Top area</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.item}>
        <Ionicons name="bar-chart-outline" size={20} color={colors.primary} />
        <Text style={styles.value}>{analytics.monthlyBookings}</Text>
        <Text style={styles.label}>This month</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginTop: 6,
    textAlign: 'center',
  },
  label: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 4,
    fontWeight: '600',
  },
});
