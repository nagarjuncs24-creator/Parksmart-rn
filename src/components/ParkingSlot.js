import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

const slotStyles = {
  available: { backgroundColor: '#D9F5DA', borderColor: '#27AE60' },
  occupied: { backgroundColor: '#FDE1E0', borderColor: '#EB5757' },
  reserved: { backgroundColor: '#FFF0D5', borderColor: colors.warning },
  maintenance: { backgroundColor: '#E8EEF8', borderColor: '#6B7C93' },
  entered: { backgroundColor: '#E8E0FF', borderColor: '#8A67FF' },
  selected: { backgroundColor: '#0D5C2E', borderColor: '#084023' },
};

const statusLabels = {
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
  maintenance: 'Maintenance',
  entered: 'Entered',
};

export default function ParkingSlot({ label, status, selected, onPress }) {
  const state = selected ? 'selected' : status;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1.04 : 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, [selected, scale]);

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={[styles.container, slotStyles[state]]}
        onPress={onPress}
        disabled={status !== 'available'}
        activeOpacity={0.85}
      >
        <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
        <Text style={[styles.status, selected && styles.statusSelected]}>
          {statusLabels[status] || 'Reserved'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '31%',
    marginBottom: 10,
  },
  container: {
    borderWidth: 1.5,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 8,
    minHeight: 96,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  labelSelected: {
    color: '#fff',
  },
  status: {
    marginTop: 8,
    fontSize: 11,
    color: colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '600',
  },
  statusSelected: {
    color: '#C8EED4',
  },
});
