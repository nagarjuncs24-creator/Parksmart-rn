import { parkingAreas } from '../data/parkingAreas';

const ACTIVE_STATUSES = ['active', 'reserved', 'occupied', 'entered'];

export function getBookingStatus(booking) {
  return booking?.bookingStatus || booking?.status || 'unknown';
}

export function computeUserBookingStats(bookings = []) {
  const total = bookings.length;
  const active = bookings.filter((booking) => ACTIVE_STATUSES.includes(getBookingStatus(booking))).length;
  const completed = bookings.filter((booking) => getBookingStatus(booking) === 'completed').length;
  const cancelled = bookings.filter((booking) => getBookingStatus(booking) === 'cancelled').length;
  const totalSpent = bookings.reduce((sum, booking) => sum + (Number(booking.totalPrice) || 0), 0);

  const areaCounts = bookings.reduce((acc, booking) => {
    const area = booking.areaName || booking.parkingArea || 'Unknown';
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {});

  const favoriteEntry = Object.entries(areaCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    total,
    active,
    completed,
    cancelled,
    totalSpent,
    favoriteArea: favoriteEntry ? favoriteEntry[0] : 'None yet',
  };
}

export function getActiveBooking(bookings = []) {
  return (
    bookings.find((booking) => ACTIVE_STATUSES.includes(getBookingStatus(booking))) || null
  );
}

export function getProfileRecommendations(bookings = [], slots = []) {
  const areaCounts = bookings.reduce((acc, booking) => {
    const area = booking.areaName || booking.parkingArea;
    if (!area) return acc;
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {});

  const frequentArea =
    Object.entries(areaCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || parkingAreas[0]?.name || 'MG Road';

  const availableSlots = slots.filter((slot) => slot.status === 'available');
  const cheapestSlot = [...availableSlots].sort(
    (a, b) => (a.price ?? a.pricePerHour ?? 50) - (b.price ?? b.pricePerHour ?? 50)
  )[0];

  const cheapestNearby = cheapestSlot
    ? `${cheapestSlot.areaName || cheapestSlot.parkingArea} · ₹${cheapestSlot.price ?? cheapestSlot.pricePerHour ?? 50}/hr`
    : 'Check Booking tab for live availability';

  const frequentAreaSlots = availableSlots.filter(
    (slot) => (slot.areaName || slot.parkingArea) === frequentArea
  );
  const bestParking =
    frequentAreaSlots.length > 0
      ? `${frequentArea} has ${frequentAreaSlots.length} open slot(s) based on your history`
      : `${frequentArea} is your top area — book early during peak hours`;

  return [
    {
      id: 'frequent',
      title: 'Frequently used area',
      description: frequentArea,
      icon: 'location',
    },
    {
      id: 'cheapest',
      title: 'Cheapest nearby parking',
      description: cheapestNearby,
      icon: 'pricetag',
    },
    {
      id: 'best',
      title: 'Best match for you',
      description: bestParking,
      icon: 'star',
    },
  ];
}

export function getBookingAreaName(booking) {
  return booking?.areaName || booking?.parkingArea || 'Unknown area';
}

export function getBookingSlotName(booking) {
  return booking?.slotName || booking?.slotLabel || '—';
}
