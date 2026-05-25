import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import QRCode from 'qrcode';
import { colors } from '../constants/theme';

const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown';
  if (timestamp.toDate) return timestamp.toDate().toLocaleString();
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toLocaleString();
  return new Date(timestamp).toLocaleString();
};

export default function TicketScreen({ navigation, route }) {
  const { booking, slot } = route.params || {};
  const [qrUri, setQrUri] = useState(null);
  const [error, setError] = useState(false);

  const ticketData = booking
    ? JSON.stringify({ bookingId: booking.bookingId, slotId: booking.slotId, userId: booking.userId, bookingTime: formatDate(booking.bookingTime) })
    : '';

  useEffect(() => {
    let active = true;
    if (!ticketData) return;

    QRCode.toDataURL(ticketData, { type: 'image/png', margin: 1, scale: 6 })
      .then((uri) => {
        if (active) setQrUri(uri);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [ticketData]);

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
          {qrUri ? (
            <Image source={{ uri: qrUri }} style={styles.qrImage} />
          ) : error ? (
            <Text style={styles.errorText}>Unable to generate QR code.</Text>
          ) : (
            <ActivityIndicator size="large" color={colors.primary} />
          )}
        </View>
        <Text style={styles.ticketTitle}>Scan at entry</Text>
        <Text style={styles.ticketStatus}>Status: {booking.status || 'active'}</Text>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.detailLabel}>Booking ID</Text>
        <Text style={styles.detailValue}>{booking.bookingId}</Text>
        <Text style={styles.detailLabel}>Slot</Text>
        <Text style={styles.detailValue}>{booking.slotId}</Text>
        <Text style={styles.detailLabel}>Area</Text>
        <Text style={styles.detailValue}>{slot?.parkingArea || 'Campus Lot'}</Text>
        <Text style={styles.detailLabel}>Booked by</Text>
        <Text style={styles.detailValue}>{booking.userId}</Text>
        <Text style={styles.detailLabel}>Time</Text>
        <Text style={styles.detailValue}>{formatDate(booking.bookingTime)}</Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}>
        <Text style={styles.primaryButtonText}>Back to dashboard</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  content: {
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
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    alignItems: 'center',
  },
  qrBox: {
    width: 196,
    height: 196,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  qrImage: {
    width: 180,
    height: 180,
    borderRadius: 14,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  ticketStatus: {
    fontSize: 13,
    color: colors.secondaryText,
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
    color: colors.secondaryText,
    marginTop: 16,
  },
  detailValue: {
    fontSize: 16,
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
    fontWeight: '700',
    fontSize: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 18,
  },
});
