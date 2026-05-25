import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Share, Alert, Linking } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '../constants/theme';
import { getSlotById, subscribeToBookingRealtime } from '../services/firestore';
import { getBookingAreaName, getBookingSlotName } from '../utils/profileStats';
import { buildBookingQrPayload } from '../utils/bookingHelpers';

const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown';
  if (timestamp.toDate) return timestamp.toDate().toLocaleString();
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toLocaleString();
  return new Date(timestamp).toLocaleString();
};

const formatCountdown = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
};

export default function TicketScreen({ navigation, route }) {
  const { bookingId } = route.params || {};
  const [booking, setBooking] = useState(null);
  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    let interval;
    const unsubscribe = subscribeToBookingRealtime(bookingId, async (bookingData) => {
      setBooking(bookingData);
      setLoading(false);

      if (bookingData?.slotId) {
        const slotData = await getSlotById(bookingData.slotId);
        setSlot(slotData);
      }

      const expiresAt = bookingData?.expiresAt;
      if (expiresAt) {
        const expiryDate = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
        const updateCountdown = () => {
          const diff = Math.max(0, Math.floor((expiryDate.getTime() - Date.now()) / 1000));
          setCountdown(diff);
          if (diff <= 0) {
            clearInterval(interval);
            setExpired(true);
            // Firestore expireBookingIfNeeded marks booking expired on next snapshot read.
          }
        };
        updateCountdown();
        clearInterval(interval);
        interval = setInterval(updateCountdown, 1000);
      }
    });

    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [bookingId]);

  const handleShare = async () => {
    if (!booking) return;
    try {
      await Share.share({
        message: `Parking ticket ${booking.bookingId} for slot ${booking.slotId} at ${slot?.parkingArea || 'Campus Lot'}.
Status: ${booking.bookingStatus || booking.status}`,
      });
    } catch (error) {
      Alert.alert('Share failed', error.message);
    }
  };

  const handleNavigate = () => {
    if (!slot?.latitude || !slot?.longitude) {
      Alert.alert('Navigation unavailable', 'Location coordinates are missing for this slot.');
      return;
    }
    const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${slot.latitude},${slot.longitude}&travelmode=driving`;
    Linking.openURL(navigationUrl).catch(() => {
      Alert.alert('Unable to open maps', 'Please install a maps app or try again later.');
    });
  };

  const ticketData = booking ? buildBookingQrPayload(booking) : '';

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Booking details unavailable.</Text>
        <Pressable style={styles.primaryButton} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}>
          <Text style={styles.primaryButtonText}>Back to dashboard</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Your parking ticket</Text>

      <View style={styles.ticketCard}>
        <View style={styles.qrBox}>
          <QRCode value={ticketData} size={180} backgroundColor="transparent" />
        </View>
        <Text style={styles.ticketTitle}>Scan at entry</Text>
          <Text style={styles.ticketStatus}>{(booking.bookingStatus || booking.status)?.toUpperCase() || 'RESERVED'}</Text>

      <View style={styles.detailCard}>
        <Text style={styles.detailLabel}>Ticket number</Text>
        <Text style={styles.detailValue}>{booking.bookingId}</Text>
        <Text style={styles.detailLabel}>Slot</Text>
        <Text style={styles.detailValue}>{getBookingSlotName(booking)}</Text>
        <Text style={styles.detailLabel}>Area</Text>
        <Text style={styles.detailValue}>{getBookingAreaName(booking)}</Text>
        {(booking.userName || booking.userId) && (
          <>
            <Text style={styles.detailLabel}>User name</Text>
            <Text style={styles.detailValue}>{booking.userName || booking.userId}</Text>
          </>
        )}
        {booking.bookingTime && (
          <>
            <Text style={styles.detailLabel}>Booking time</Text>
            <Text style={styles.detailValue}>{formatDate(booking.bookingTime)}</Text>
          </>
        )}
        {booking.durationHours && (
          <>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{booking.durationHours} hours</Text>
          </>
        )}
        {booking.paymentStatus && (
          <>
            <Text style={styles.detailLabel}>Payment status</Text>
            <Text style={styles.detailValue}>{booking.paymentStatus}</Text>
          </>
        )}
        {typeof booking.totalPrice === 'number' && (
          <>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.detailValue}>₹{booking.totalPrice}</Text>
          </>
        )}
        {countdown !== null && !expired && (
          <>
            <Text style={styles.detailLabel}>Time valid</Text>
            <Text style={styles.detailValue}>{formatCountdown(countdown)}</Text>
          </>
        )}
        {!expired && (
          <View style={styles.instructionsCard}>
            <Text style={styles.detailLabel}>Parking instructions</Text>
            <Text style={styles.detailValue}>Arrive within the timer window, show this QR code at the gate, and keep your phone handy for updates.</Text>
          </View>
        )}
        {expired && <Text style={styles.expiredText}>Reservation expired — booking cancelled.</Text>}
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.secondaryButton} onPress={handleShare}>
          <Text style={styles.secondaryButtonText}>Share ticket</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={handleNavigate}>
          <Text style={styles.primaryButtonText}>Navigate</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}>
          <Text style={styles.primaryButtonText}>Back to dashboard</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 18,
  },
  ticketCard: {
    backgroundColor: colors.panel,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qrBox: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 16,
    marginBottom: 18,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  ticketStatus: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  detailCard: {
    backgroundColor: colors.panel,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondaryText,
    marginTop: 16,
  },
  detailValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: colors.panel,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 10,
  },
  secondaryButtonText: {
    color: colors.text,
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
  errorText: {
    fontSize: 18,
    color: colors.danger,
    marginBottom: 18,
    textAlign: 'center',
  },
  instructionsCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    padding: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  expiredText: {
    marginTop: 18,
    color: colors.danger,
    fontWeight: '700',
  },
});
