import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, StyleSheet, View } from 'react-native';
import { colors } from '../constants/theme';
import { getTrafficLevelColor } from '../services/predictions';

export default function ParkingAreaCard({ area, selected, trafficLevel, onPress }) {
  const scale = useRef(new Animated.Value(selected ? 1 : 0.96)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1 : 0.96,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [selected, scale]);

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          styles.card,
          selected && styles.cardSelected,
          { transform: [{ scale }] },
        ]}
      >
        <Text style={[styles.name, selected && styles.nameSelected]} numberOfLines={1}>
          {area.name}
        </Text>
        <View style={[styles.trafficPill, { backgroundColor: getTrafficLevelColor(trafficLevel) }]}>
          <Text style={styles.trafficText}>{trafficLevel}</Text>
        </View>
        <Text style={[styles.slotHint, selected && styles.slotHintSelected]}>
          {area.slots?.length || 0} slots
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 132,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.panel,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: 12,
    shadowColor: '#1F8A4C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardSelected: {
    backgroundColor: colors.primary,
    borderColor: '#0D5C2E',
    shadowOpacity: 0.22,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  nameSelected: {
    color: '#fff',
  },
  trafficPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  trafficText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  slotHint: {
    fontSize: 12,
    color: colors.secondaryText,
  },
  slotHintSelected: {
    color: '#E8F8EE',
  },
});
