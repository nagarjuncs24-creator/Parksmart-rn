import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { createNotification } from './firestore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function initNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('parking', {
      name: 'Parking updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export async function getExpoPushToken() {
  try {
    const granted = await initNotifications();
    if (!granted) return null;
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}

export async function sendLocalNotification(title, body, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null,
  });
}

export async function scheduleExpiryReminder(bookingId, expiresAt, areaName) {
  const expiry = expiresAt?.toDate ? expiresAt.toDate() : new Date(expiresAt);
  if (!expiry || Number.isNaN(expiry.getTime())) return;

  const secondsUntil = Math.floor((expiry.getTime() - Date.now()) / 1000) - 300;
  if (secondsUntil <= 0) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Booking expiring soon',
      body: `Your reservation at ${areaName} expires in 5 minutes.`,
      data: { bookingId, type: 'booking_expiring' },
    },
    trigger: { seconds: secondsUntil },
  });
}

export async function notifyUser(userId, { title, body, type, bookingId }) {
  await createNotification({
    userId,
    title,
    body,
    type,
    bookingId: bookingId || null,
    read: false,
  });
  await sendLocalNotification(title, body, { type, bookingId });
}

export const NOTIFICATION_TYPES = {
  BOOKING_CONFIRMED: 'booking_confirmed',
  SLOT_RESERVED: 'slot_reserved',
  PAYMENT_SUCCESS: 'payment_success',
  BOOKING_EXPIRING: 'booking_expiring',
  SLOT_RELEASED: 'slot_released',
};

export async function notifyBookingFlow(userId, booking, areaName) {
  await notifyUser(userId, {
    title: 'Booking confirmed',
    body: `Your parking at ${areaName} is confirmed.`,
    type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
    bookingId: booking.id,
  });

  await notifyUser(userId, {
    title: 'Slot reserved',
    body: `Slot reserved at ${areaName}. Show QR at entry.`,
    type: NOTIFICATION_TYPES.SLOT_RESERVED,
    bookingId: booking.id,
  });

  await notifyUser(userId, {
    title: 'Payment successful',
    body: `₹${booking.totalPrice || 0} paid successfully.`,
    type: NOTIFICATION_TYPES.PAYMENT_SUCCESS,
    bookingId: booking.id,
  });

  if (booking.expiresAt) {
    await scheduleExpiryReminder(booking.id, booking.expiresAt, areaName);
  }
}
