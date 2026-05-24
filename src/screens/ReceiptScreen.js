import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { getBookingById, getPaymentByBookingId } from '../services/firestore';
import { getCurrentUser } from '../services/auth';
import { getBookingAreaName, getBookingSlotName } from '../utils/profileStats';
import { formatDateTime, getBookingStartTime } from '../utils/bookingHelpers';
import { generateReceiptPdf, shareReceiptPdf, shareReceiptText, saveReceiptToDownloads } from '../services/receipt';

export default function ReceiptScreen({ navigation, route }) {
  const { bookingId } = route.params || {};
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const userName = getCurrentUser()?.displayName || getCurrentUser()?.email || 'Guest';

  useEffect(() => {
    const load = async () => {
      if (!bookingId) {
        setLoading(false);
        return;
      }
      const bookingData = await getBookingById(bookingId);
      const paymentData = await getPaymentByBookingId(bookingId);
      setBooking(bookingData);
      setPayment(paymentData);
      setLoading(false);
    };
    load();
  }, [bookingId]);

  const handleDownload = async () => {
    if (!booking) return;
    setWorking(true);
    try {
      const pdfUri = await generateReceiptPdf({ booking, payment, userName });
      const saved = await saveReceiptToDownloads(pdfUri, booking.bookingId || booking.id);
      Alert.alert('Receipt saved', `PDF saved to app documents:\n${saved}`);
    } catch (error) {
      Alert.alert('Download failed', error.message);
    } finally {
      setWorking(false);
    }
  };

  const handleShare = async () => {
    if (!booking) return;
    setWorking(true);
    try {
      const pdfUri = await generateReceiptPdf({ booking, payment, userName });
      await shareReceiptPdf(pdfUri);
    } catch {
      const message = await shareReceiptText({ booking, payment, userName });
      await Share.share({ message });
    } finally {
      setWorking(false);
    }
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
        <Text style={styles.error}>Receipt unavailable.</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const method = payment?.method || booking.paymentProvider || 'Test Payment';

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Pressable style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <View style={styles.receipt}>
        <Text style={styles.logo}>ParkSmart</Text>
        <Text style={styles.tagline}>Payment receipt</Text>
        <View style={styles.divider} />

        <Row label="Customer" value={userName} />
        <Row label="Booking ID" value={booking.bookingId || booking.id} />
        <Row label="Payment ID" value={payment?.paymentId || payment?.transactionId || '—'} />
        <Row label="Area" value={getBookingAreaName(booking)} />
        <Row label="Slot" value={getBookingSlotName(booking)} />
        <Row label="Date & time" value={formatDateTime(getBookingStartTime(booking))} />
        <Row label="Payment method" value={method} />

        <Text style={styles.total}>₹{booking.totalPrice || 0}</Text>
        <Text style={styles.paid}>Amount paid</Text>
      </View>

      <Pressable
        style={styles.ticketLink}
        onPress={() => navigation.replace('Ticket', { bookingId: booking.id })}
      >
        <Text style={styles.ticketLinkText}>Open parking ticket & QR</Text>
      </Pressable>

      <View style={styles.actions}>
        <Pressable style={styles.btn} onPress={handleDownload} disabled={working}>
          {working ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>Download PDF</Text>
            </>
          )}
        </Pressable>
        <Pressable style={[styles.btn, styles.shareBtn]} onPress={handleShare} disabled={working}>
          <Ionicons name="share-social-outline" size={18} color={colors.primaryDark} />
          <Text style={[styles.btnText, styles.shareText]}>Share receipt</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  backText: { fontSize: 16, fontWeight: '600' },
  receipt: {
    backgroundColor: colors.panel,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#1F8A4C',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  logo: { fontSize: 30, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  tagline: { textAlign: 'center', color: colors.secondaryText, marginBottom: 16 },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { color: colors.secondaryText, fontSize: 14 },
  value: { fontWeight: '700', color: colors.text, fontSize: 14, maxWidth: '58%', textAlign: 'right' },
  total: { fontSize: 32, fontWeight: '800', color: colors.primary, textAlign: 'center', marginTop: 20 },
  paid: { textAlign: 'center', color: colors.secondaryText, marginTop: 4 },
  ticketLink: { alignItems: 'center', marginTop: 20, paddingVertical: 12 },
  ticketLinkText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  actions: { marginTop: 12, gap: 12 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
  },
  shareBtn: { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.border },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  shareText: { color: colors.primaryDark },
  error: { color: colors.danger, marginBottom: 12 },
  link: { color: colors.primary, fontWeight: '700' },
});
