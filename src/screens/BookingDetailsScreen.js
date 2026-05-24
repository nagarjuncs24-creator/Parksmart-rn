import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { getBookingById, getSlotById, getPaymentByBookingId, getUserById } from '../services/firestore';
import { getCurrentUser } from '../services/auth';
import StatusBadge from '../components/history/StatusBadge';
import { getBookingAreaName, getBookingSlotName } from '../utils/profileStats';
import {
  buildBookingQrPayload,
  formatDateTime,
  formatTimeOnly,
  getBookingStartTime,
  getBookingEndTime,
  getDisplayBookingStatus,
} from '../utils/bookingHelpers';
import { formatDurationLabel } from '../utils/profileFormat';

export default function BookingDetailsScreen({ navigation, route }) {
  const { bookingId } = route.params || {};
  const [booking, setBooking] = useState(null);
  const [slot, setSlot] = useState(null);
  const [payment, setPayment] = useState(null);
  const [vehicleNumber, setVehicleNumber] = useState('—');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!bookingId) {
        setLoading(false);
        return;
      }
      try {
        const bookingData = await getBookingById(bookingId);
        setBooking(bookingData);
        if (bookingData?.slotId) {
          const slotData = await getSlotById(bookingData.slotId);
          setSlot(slotData);
        }
        const paymentData = await getPaymentByBookingId(bookingId);
        setPayment(paymentData);

        const user = getCurrentUser();
        if (user) {
          const profile = await getUserById(user.uid);
          setVehicleNumber(profile?.vehicleNumber || bookingData?.vehicleNumber || '—');
        }
      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookingId]);

  const handleNavigate = () => {
    if (!slot?.latitude || !slot?.longitude) {
      Alert.alert('Navigation unavailable', 'Coordinates not available for this slot.');
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${slot.latitude},${slot.longitude}&travelmode=driving`;
    Linking.openURL(url).catch(() => Alert.alert('Unable to open maps'));
  };

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
        <Text style={styles.error}>Booking not found.</Text>
        <Pressable style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const showQr = getDisplayBookingStatus(booking) === 'Active';
  const qrValue = buildBookingQrPayload(booking);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Pressable style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>Booking details</Text>
        <StatusBadge booking={booking} />
      </View>

      {showQr && (
        <View style={styles.qrCard}>
          <QRCode value={qrValue} size={180} />
          <Text style={styles.qrHint}>Scan at parking entry · Admin verification</Text>
        </View>
      )}

      <View style={styles.card}>
        <Detail icon="location-outline" label="Area" value={getBookingAreaName(booking)} />
        <Detail icon="grid-outline" label="Slot" value={getBookingSlotName(booking)} />
        <Detail icon="car-outline" label="Vehicle" value={vehicleNumber} />
        <Detail icon="time-outline" label="Duration" value={formatDurationLabel(booking.durationHours)} />
        <Detail icon="play-outline" label="Start" value={formatTimeOnly(getBookingStartTime(booking))} />
        <Detail icon="stop-outline" label="End" value={formatTimeOnly(getBookingEndTime(booking))} />
        <Detail icon="calendar-outline" label="Booked on" value={formatDateTime(getBookingStartTime(booking))} />
        <Detail icon="cash-outline" label="Amount" value={`₹${booking.totalPrice || 0}`} />
        <Detail icon="receipt-outline" label="Payment ID" value={payment?.paymentId || payment?.transactionId || booking.paymentReference || '—'} />
        <Detail icon="finger-print-outline" label="Booking ID" value={booking.bookingId || booking.id} />
        <Detail icon="checkmark-circle-outline" label="Payment status" value={booking.paymentStatus || '—'} />
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.secondaryBtn} onPress={handleNavigate}>
          <Ionicons name="navigate" size={18} color={colors.primaryDark} />
          <Text style={styles.secondaryText}>Navigate</Text>
        </Pressable>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Receipt', { bookingId: booking.id })}
        >
          <Text style={styles.primaryText}>View receipt</Text>
        </Pressable>
      </View>

      {showQr && (
        <Pressable
          style={styles.ticketBtn}
          onPress={() => navigation.getParent()?.navigate('Ticket', { bookingId: booking.id })}
        >
          <Text style={styles.ticketText}>Open live ticket</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function Detail({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <View style={styles.detailBody}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  backText: { fontSize: 16, fontWeight: '600', color: colors.text },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  qrCard: {
    backgroundColor: colors.panel,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qrHint: { marginTop: 12, color: colors.secondaryText, fontSize: 13, textAlign: 'center' },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  detailRow: { flexDirection: 'row', marginBottom: 16 },
  detailBody: { marginLeft: 12, flex: 1 },
  detailLabel: { fontSize: 12, color: colors.secondaryText, fontWeight: '600' },
  detailValue: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12 },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.panel,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: { color: colors.primaryDark, fontWeight: '700' },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700' },
  ticketBtn: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 14,
  },
  ticketText: { color: colors.primary, fontWeight: '700' },
  btn: { backgroundColor: colors.primary, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { color: '#fff', fontWeight: '700' },
  error: { fontSize: 16, color: colors.danger, marginBottom: 16 },
});
