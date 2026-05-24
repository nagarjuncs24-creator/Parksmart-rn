import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';
import { getAreaName, getSlotDisplayName } from '../../utils/slots';

const statusColors = {
  available: colors.successLight,
  occupied: colors.dangerLight,
  reserved: '#FFF0D5',
  maintenance: '#E8EEF8',
  entered: '#E8E0FF',
};

export default function SlotAdminCard({ slot, onEdit, onDelete, onStatusCycle }) {
  const displayName = getSlotDisplayName(slot);
  const areaName = getAreaName(slot);

  return (
    <View style={[styles.card, { borderLeftColor: statusColors[slot.status] || colors.border }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{displayName}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{slot.status}</Text>
        </View>
      </View>
      <Text style={styles.meta}>{areaName}</Text>
      <Text style={styles.meta}>
        ₹{slot.price ?? slot.pricePerHour ?? 50}/hr · {slot.trafficLevel || 'Medium'} traffic
      </Text>
      <Text style={styles.meta}>
        {slot.evCharging ? 'EV ✓' : 'EV ✗'} · {slot.largeVehicle ? 'Large ✓' : 'Large ✗'}
      </Text>

      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={() => onStatusCycle(slot)}>
          <Text style={styles.actionText}>Status</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => onEdit(slot)}>
          <Text style={styles.actionText}>Edit</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={() => onDelete(slot.id)}>
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </Pressable>
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
    borderLeftWidth: 5,
    shadowColor: '#1F8A4C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  statusBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    textTransform: 'capitalize',
  },
  meta: {
    fontSize: 13,
    color: colors.secondaryText,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteBtn: {
    backgroundColor: colors.dangerLight,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  deleteText: {
    color: colors.danger,
  },
});
