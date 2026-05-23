import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '../constants/theme';

const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown';
  if (timestamp.toDate) return timestamp.toDate().toLocaleString();
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toLocaleString();
  return new Date(timestamp).toLocaleString();
};

export default function TicketScreen({ navigation, route }) {
  const { booking, slot } = route.params || {};
  const ticketData = booking
    ? JSON.stringify({ bookingId: booking.bookingId, slotId: booking.slotId, userId: booking.userId, bookingTime: formatDate(booking.bookingTime) })
    : '';

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
