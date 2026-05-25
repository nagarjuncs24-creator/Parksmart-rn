import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';

export default function AreaStatsCard({ stats }) {
  if (!stats) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{stats.areaName}</Text>
      <View style={styles.row}>
        <StatPill label="Total" value={stats.totalSlots} />
        <StatPill label="Available" value={stats.availableSlots} accent={colors.success} />
        <StatPill label="Occupied" value={stats.occupiedSlots} accent={colors.danger} />
      </View>
      <Text style={styles.meta}>Revenue: ₹{stats.revenueGenerated}</Text>
      <Text style={styles.meta}>Peak demand: {stats.peakDemandTime}</Text>
    </View>
  );
}

function StatPill({ label, value, accent }) {
  return (
    <View style={styles.pill}>
      <Text style={[styles.pillValue, accent && { color: accent }]}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primaryLight,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderRadius: 14,
    paddingVertical: 10,
    marginHorizontal: 4,
  },
  pillValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  pillLabel: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 4,
    fontWeight: '600',
  },
  meta: {
    fontSize: 13,
    color: colors.secondaryText,
    marginTop: 4,
  },
});
