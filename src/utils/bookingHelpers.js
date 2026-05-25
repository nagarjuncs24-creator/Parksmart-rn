import { parseTimestamp } from './profileFormat';
import { getBookingAreaName, getBookingSlotName } from './profileStats';

const ACTIVE_RAW = ['active', 'reserved', 'occupied', 'entered'];

export function getRawBookingStatus(booking) {
  return (booking?.bookingStatus || booking?.status || 'unknown').toLowerCase();
}

export function isBookingExpired(booking) {
  if (!booking?.expiresAt) return false;
  const expiry = parseTimestamp(booking.expiresAt);
  if (!expiry) return false;
  const raw = getRawBookingStatus(booking);
  return expiry.getTime() <= Date.now() && ACTIVE_RAW.includes(raw);
}

export function getDisplayBookingStatus(booking) {
  const raw = getRawBookingStatus(booking);
  if (raw === 'expired' || isBookingExpired(booking)) return 'Expired';
  if (raw === 'cancelled') return 'Cancelled';
  if (raw === 'completed') return 'Completed';
  if (ACTIVE_RAW.includes(raw)) return 'Active';
  return 'Active';
}

export const STATUS_BADGE_STYLES = {
  Completed: { backgroundColor: '#D9F5DA', color: '#1F8A4C', borderColor: '#27AE60' },
  Active: { backgroundColor: '#E3F0FF', color: '#1A5FB4', borderColor: '#3A82F7' },
  Cancelled: { backgroundColor: '#FDE1E0', color: '#C0392B', borderColor: '#EB5757' },
  Expired: { backgroundColor: '#FFF0D5', color: '#D68910', borderColor: '#F2994A' },
};

export function getBookingStartTime(booking) {
  return parseTimestamp(booking?.startTime || booking?.bookingTime || booking?.createdAt);
}

export function getBookingEndTime(booking) {
  const explicit = parseTimestamp(booking?.endTime);
  if (explicit) return explicit;

  const start = getBookingStartTime(booking);
  const hours = Number(booking?.durationHours) || 1;
  if (start && !Number.isNaN(start.getTime())) {
    return new Date(start.getTime() + hours * 60 * 60 * 1000);
  }

  return parseTimestamp(booking?.expiresAt);
}

export function formatTimeOnly(date) {
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function formatDateOnly(date) {
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(date) {
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

export function computeUserHistoryAnalytics(bookings = []) {
  const totalSpent = bookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

  const areaCounts = bookings.reduce((acc, booking) => {
    const area = getBookingAreaName(booking);
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {});

  const mostUsedArea =
    Object.entries(areaCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None yet';

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
  const monthlyBookings = bookings.filter((booking) => {
    const date = parseTimestamp(booking.bookingTime || booking.createdAt);
    if (!date) return false;
    return `${date.getFullYear()}-${date.getMonth()}` === monthKey;
  }).length;

  return {
    totalSpent,
    mostUsedArea,
    monthlyBookings,
  };
}

export function buildBookingQrPayload(booking) {
  if (!booking) return '';
  if (booking.qrData) return booking.qrData;
  return JSON.stringify({
    bookingId: booking.bookingId || booking.id,
    slotId: booking.slotId,
    userId: booking.userId,
    area: getBookingAreaName(booking),
    slot: getBookingSlotName(booking),
    status: getDisplayBookingStatus(booking),
  });
}
