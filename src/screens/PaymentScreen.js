import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { colors } from '../constants/theme';
import { getCurrentUser } from '../services/auth';
import {
  createBooking,
  createPayment,
  updateSlotStatus,
  getSlotById,
  getUserById,
} from '../services/firestore';
import { processTestPayment } from '../services/payment';
import { getSlotDisplayName } from '../utils/slots';
import { notifyBookingFlow } from '../services/notifications';

export default function PaymentScreen({ navigation, route }) {
  const { selectedSlot, durationOption, totalPrice } = route.params || {};
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      Alert.alert('Authentication required', 'Please login to continue.');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      return;
    }

    if (!selectedSlot || !durationOption || !totalPrice) {
      Alert.alert('Missing details', 'Booking information is incomplete.');
      navigation.goBack();
      return;
    }

    setLoading(true);
    try {
      const latestSlot = await getSlotById(selectedSlot.id);
      if (!latestSlot || latestSlot.status !== 'available') {
        Alert.alert('Slot unavailable', 'The selected slot is no longer available. Please choose another slot.');
        navigation.navigate('Booking');
        return;
      }

      const paymentResult = await processTestPayment(totalPrice);
      if (!paymentResult.success) {
        throw new Error('Payment failed during test checkout.');
      }

      const profile = await getUserById(currentUser.uid);
      const areaName = selectedSlot.parkingArea || selectedSlot.areaName || 'Campus Lot';
      const startTime = new Date();
      const durationHours = durationOption.hours || 1;
      const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

      const booking = await createBooking({
        userId: currentUser.uid,
        userName: currentUser.displayName || profile?.name || currentUser.email || 'Guest',
        slotId: selectedSlot.id,
        slotName: getSlotDisplayName(selectedSlot),
        parkingArea: areaName,
        areaName,
        vehicleNumber: profile?.vehicleNumber || '',
        bookingTime: startTime,
        startTime,
        endTime,
        status: 'active',
        bookingStatus: 'active',
        paymentStatus: 'success',
        durationHours,
        totalPrice,
        paymentProvider: paymentResult.provider,
        paymentReference: paymentResult.transactionId,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      await createPayment({
        userId: currentUser.uid,
        bookingId: booking.id,
        amount: totalPrice,
        method: 'Test Payment',
        transactionId: paymentResult.transactionId,
        paymentId: paymentResult.transactionId,
        userName: booking.userName,
        slotName: booking.slotName,
        areaName,
        status: 'success',
      });

      await updateSlotStatus(selectedSlot.id, 'occupied');
      await notifyBookingFlow(currentUser.uid, booking, areaName);

      navigation.replace('Receipt', { bookingId: booking.id });
    } catch (error) {
      Alert.alert('Payment error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedSlot) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Booking slot is missing.</Text>
        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Booking')}>
          <Text style={styles.primaryButtonText}>Choose a slot</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <Text style={styles.heading}>Payment summary</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Slot</Text>
        <Text style={styles.value}>{getSlotDisplayName(selectedSlot)}</Text>
        <Text style={styles.label}>Area</Text>
        <Text style={styles.value}>{selectedSlot.parkingArea || 'Campus Lot'}</Text>
        <Text style={styles.label}>Duration</Text>
        <Text style={styles.value}>{durationOption?.label || '1 hour'}</Text>
        <Text style={styles.label}>Amount</Text>
        <Text style={styles.value}>₹{totalPrice}</Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={handlePayment} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Pay and reserve slot</Text>}
      </Pressable>

      <Text style={styles.notice}>Booking will be reserved for 15 minutes after successful payment.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 18,
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 26,
  },
  label: {
    fontSize: 14,
    color: colors.secondaryText,
    marginTop: 14,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  notice: {
    marginTop: 18,
    color: colors.secondaryText,
    lineHeight: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: colors.danger,
    marginBottom: 18,
    textAlign: 'center',
  },
});
