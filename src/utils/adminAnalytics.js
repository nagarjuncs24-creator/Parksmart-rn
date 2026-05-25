function parseBookingDate(booking) {
  const raw = booking.bookingTime || booking.createdAt;
  if (!raw) return null;
  if (raw.toDate) return raw.toDate();
  if (raw.seconds) return new Date(raw.seconds * 1000);
  return new Date(raw);
}

function getSlotAreaName(slot) {
  return slot.areaName || slot.parkingArea || '';
}

export function getAreaStatistics(areaName, slots = [], bookings = []) {
  const areaSlots = slots.filter((slot) => getSlotAreaName(slot) === areaName);
  const areaBookings = bookings.filter((booking) => (booking.parkingArea || booking.areaName) === areaName);

  const totalSlots = areaSlots.length;
  const availableSlots = areaSlots.filter((slot) => slot.status === 'available').length;
  const occupiedSlots = areaSlots.filter((slot) =>
    ['occupied', 'entered', 'reserved'].includes(slot.status)
  ).length;

  const revenueGenerated = areaBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);

  const hourCounts = areaBookings.reduce((acc, booking) => {
    const date = parseBookingDate(booking);
    if (!date) return acc;
    const hour = date.getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});

  const peakEntry = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
  const peakDemandTime = peakEntry ? `${peakEntry[0]}:00 (${peakEntry[1]} bookings)` : 'No bookings yet';

  return {
    areaName,
    totalSlots,
    availableSlots,
    occupiedSlots,
    revenueGenerated,
    peakDemandTime,
  };
}

export function getAllAreaStatistics(slots, bookings, areaNames = []) {
  const names = areaNames.length
    ? areaNames
    : [...new Set(slots.map(getSlotAreaName).filter(Boolean))];

  return names.map((name) => getAreaStatistics(name, slots, bookings));
}
