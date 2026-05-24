import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { colors } from '../constants/theme';
import ParkingSlot from '../components/ParkingSlot';
import ParkingAreaCard from '../components/ParkingAreaCard';
import { parkingAreas } from '../data/parkingAreas';
import { subscribeToSlotsRealtime } from '../services/firestore';
import {
  getAreaTrafficLevel,
  getTrafficLevelColor,
  isPeakHour,
  predictParkingPrice,
} from '../services/predictions';
import { filterSlotsByArea, getSlotDisplayName, sortSlotsForDisplay } from '../utils/slots';

const durationOptions = [
  { label: '1 hour', hours: 1 },
  { label: '2 hours', hours: 2 },
  { label: 'Full day', hours: 24 },
];

function SummaryRow({ label, value, highlight }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryRowValue, highlight && styles.summaryHighlight]}>{value}</Text>
    </View>
  );
}

export default function BookingScreen({ navigation }) {
  const [slots, setSlots] = useState([]);
  const [selectedArea, setSelectedArea] = useState(parkingAreas[0]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(durationOptions[0]);
  const [loading, setLoading] = useState(true);
  const priceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const unsubscribe = subscribeToSlotsRealtime((slotList) => {
      setSlots(slotList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const areaSlots = useMemo(
    () => sortSlotsForDisplay(filterSlotsByArea(slots, selectedArea?.name)),
    [slots, selectedArea]
  );

  const trafficLevel = useMemo(
    () => getAreaTrafficLevel(selectedArea?.name, areaSlots),
    [selectedArea, areaSlots]
  );

  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId);

  const predictedPrice = useMemo(
    () => predictParkingPrice(selectedArea, selectedDuration, trafficLevel),
    [selectedArea, selectedDuration, trafficLevel, selectedSlotId]
  );

  useEffect(() => {
    Animated.sequence([
      Animated.timing(priceAnim, { toValue: 0.92, duration: 90, useNativeDriver: true }),
      Animated.spring(priceAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  }, [predictedPrice, selectedArea, selectedDuration, selectedSlotId, priceAnim]);

  useEffect(() => {
    if (!selectedSlotId) return;
    const stillValid = areaSlots.some((slot) => slot.id === selectedSlotId);
    if (!stillValid) {
      setSelectedSlotId(null);
    }
  }, [areaSlots, selectedSlotId]);

  const handleAreaSelect = (area) => {
    setSelectedArea(area);
    setSelectedSlotId(null);
  };

  const handleContinue = () => {
    if (!selectedSlot) {
      Alert.alert('Pick a slot first', 'Select an available slot to continue.');
      return;
    }
    if (selectedSlot.status !== 'available') {
      Alert.alert('Slot unavailable', 'Please select a different available slot.');
      return;
    }

    navigation.navigate('Confirmation', {
      selectedSlot,
      durationOption: {
        ...selectedDuration,
        price: predictedPrice,
      },
      totalPrice: predictedPrice,
      trafficLevel,
      selectedAreaName: selectedArea.name,
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading smart parking insights…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Smart parking booking</Text>
      <Text style={styles.subtitle}>
        AI-adjusted pricing based on live traffic{isPeakHour() ? ' · Peak hours active' : ''}.
      </Text>

      <Text style={styles.sectionTitle}>Choose parking area</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.areaScroll}
        decelerationRate="fast"
      >
        {parkingAreas.map((area) => (
          <ParkingAreaCard
            key={area.id}
            area={area}
            selected={selectedArea?.id === area.id}
            trafficLevel={getAreaTrafficLevel(area.name, filterSlotsByArea(slots, area.name))}
            onPress={() => handleAreaSelect(area)}
          />
        ))}
      </ScrollView>

      <View style={styles.slotsHeader}>
        <Text style={styles.sectionTitle}>Slots in {selectedArea.name}</Text>
        <View style={[styles.trafficBadge, { backgroundColor: getTrafficLevelColor(trafficLevel) }]}>
          <Text style={styles.trafficBadgeText}>{trafficLevel} traffic</Text>
        </View>
      </View>

      {areaSlots.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No slots loaded for this area</Text>
          <Text style={styles.emptyText}>Run npm run seed-parking to sync Firebase slots for all areas.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {areaSlots.map((slot) => (
            <ParkingSlot
              key={slot.id}
              label={getSlotDisplayName(slot)}
              status={slot.status || 'available'}
              selected={selectedSlotId === slot.id}
              onPress={() => {
                if (slot.status === 'available') {
                  setSelectedSlotId(slot.id);
                }
              }}
            />
          ))}
        </View>
      )}

      <View style={styles.durationCard}>
        <Text style={styles.sectionTitle}>Parking duration</Text>
        <View style={styles.durationRow}>
          {durationOptions.map((option) => {
            const optionPrice = predictParkingPrice(selectedArea, option, trafficLevel);
            const isSelected = selectedDuration.hours === option.hours;
            return (
              <Pressable
                key={option.hours}
                style={[styles.durationOption, isSelected && styles.durationSelected]}
                onPress={() => setSelectedDuration(option)}
              >
                <Text style={[styles.durationLabel, isSelected && styles.durationSelectedLabel]}>{option.label}</Text>
                <Text style={[styles.durationPrice, isSelected && styles.durationSelectedLabel]}>₹{optionPrice}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>AI booking summary</Text>
        <SummaryRow label="Area" value={selectedArea.name} />
        <SummaryRow label="Slot" value={selectedSlot ? getSlotDisplayName(selectedSlot) : 'None selected'} />
        <SummaryRow label="Traffic level" value={trafficLevel} />
        <SummaryRow label="Duration" value={selectedDuration.label} />
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Predicted price</Text>
          <Animated.Text style={[styles.predictedPrice, { transform: [{ scale: priceAnim }] }]}>
            ₹{predictedPrice}
          </Animated.Text>
        </View>
        <Text style={styles.summaryHint}>
          Base ₹50 + traffic surcharge + {isPeakHour() ? 'peak-hour ₹30 + ' : ''}duration multiplier
        </Text>
      </View>

      <Pressable
        style={[styles.bookButton, !selectedSlot && styles.bookButtonDisabled]}
        onPress={handleContinue}
        disabled={!selectedSlot}
      >
        <Text style={styles.bookButtonText}>Continue to confirmation · ₹{predictedPrice}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pageContent: {
    padding: 20,
    paddingBottom: 36,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    color: colors.secondaryText,
    marginBottom: 20,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  areaScroll: {
    paddingBottom: 8,
    paddingRight: 8,
    marginBottom: 22,
  },
  slotsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  trafficBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  trafficBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  emptyCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  emptyText: {
    color: colors.secondaryText,
    lineHeight: 20,
  },
  durationCard: {
    backgroundColor: colors.panel,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    shadowColor: '#1F8A4C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationOption: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: 14,
    marginRight: 8,
  },
  durationSelected: {
    backgroundColor: colors.primary,
    borderColor: '#0D5C2E',
  },
  durationLabel: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 8,
    fontWeight: '600',
  },
  durationPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  durationSelectedLabel: {
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: colors.panel,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    shadowColor: '#1F8A4C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.secondaryText,
  },
  summaryRowValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  summaryHighlight: {
    color: colors.primary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  predictedPrice: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
  },
  summaryHint: {
    fontSize: 12,
    color: colors.secondaryText,
    lineHeight: 18,
    marginTop: 4,
  },
  bookButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#1F8A4C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  bookButtonDisabled: {
    backgroundColor: '#A0D1A4',
    shadowOpacity: 0,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  loadingText: {
    marginTop: 14,
    color: colors.secondaryText,
    fontSize: 14,
  },
});
