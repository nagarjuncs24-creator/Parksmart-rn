export const TRAFFIC_LEVELS = ['Low', 'Medium', 'High'];

const BASE_PRICE = 50;
const TRAFFIC_SURCHARGE = {
  High: 40,
  Medium: 20,
  Low: 10,
};
const PEAK_SURCHARGE = 30;
const PEAK_START_HOUR = 17;
const PEAK_END_HOUR = 21;

export function isPeakHour(date = new Date()) {
  const hour = date.getHours();
  return hour >= PEAK_START_HOUR && hour < PEAK_END_HOUR;
}

export function getDurationMultiplier(duration) {
  const hours = duration?.hours ?? 1;
  if (hours >= 24) return 4;
  if (hours >= 2) return 2;
  return 1;
}

export function predictParkingPrice(area, duration, traffic) {
  const trafficLevel = TRAFFIC_SURCHARGE[traffic] !== undefined ? traffic : 'Medium';
  let unitPrice = BASE_PRICE + TRAFFIC_SURCHARGE[trafficLevel];

  if (isPeakHour()) {
    unitPrice += PEAK_SURCHARGE;
  }

  const areaBoost = area?.pricePerHour && area.pricePerHour > BASE_PRICE ? area.pricePerHour - BASE_PRICE : 0;
  unitPrice += areaBoost;

  return Math.round(unitPrice * getDurationMultiplier(duration));
}

const TRAFFIC_LEVEL_SCORE = { High: 3, Medium: 2, Low: 1 };

export function getAreaTrafficLevel(areaName, areaSlots = []) {
  const configuredLevels = areaSlots.map((slot) => slot.trafficLevel).filter(Boolean);
  if (configuredLevels.length) {
    const average =
      configuredLevels.reduce((sum, level) => sum + (TRAFFIC_LEVEL_SCORE[level] || 2), 0) /
      configuredLevels.length;
    if (average >= 2.5) return 'High';
    if (average >= 1.5) return 'Medium';
    return 'Low';
  }

  const hour = new Date().getHours();
  const total = areaSlots.length;
  const available = areaSlots.filter((slot) => slot.status === 'available').length;
  const occupancy = total ? 1 - available / total : 0;

  let score = 0;

  if (occupancy >= 0.66) score += 2;
  else if (occupancy >= 0.33) score += 1;

  if (hour >= PEAK_START_HOUR && hour < PEAK_END_HOUR) score += 2;
  else if ((hour >= 8 && hour < 12) || (hour >= 12 && hour < 17)) score += 1;

  const busyAreas = ['MG Road', 'Indiranagar', 'Koramangala', 'Whitefield'];
  if (busyAreas.includes(areaName)) score += 1;

  if (score >= 4) return 'High';
  if (score >= 2) return 'Medium';
  return 'Low';
}

export function getTrafficPrediction(slots = []) {
  const totalSlots = slots.length;
  const availableSlots = slots.filter((slot) => slot.status === 'available').length;
  const availability = totalSlots ? availableSlots / totalSlots : 0;
  const hour = new Date().getHours();

  let label = 'Parking availability';
  let level = 'Normal traffic';
  let recommendation = 'Review availability and choose a slot soon.';
  let accent = '#3A82F7';

  if (hour >= 6 && hour < 12) {
    label = 'Morning rush';
  } else if (hour >= 12 && hour < 18) {
    label = 'Afternoon demand';
  } else {
    label = 'Evening window';
  }

  if (availability <= 0.2) {
    level = 'Very low availability';
    recommendation = 'Reserve a parking slot now to avoid full lots.';
    accent = '#C0392B';
  } else if (availability <= 0.5) {
    level = 'Limited availability';
    recommendation = 'Slots are filling fast — book soon.';
    accent = '#D68910';
  } else {
    level = 'Good availability';
    recommendation = 'Parking is still available across nearby lots.';
    accent = '#27AE60';
  }

  return {
    label,
    level,
    recommendation,
    accent,
  };
}

export function getTrafficLevelColor(level) {
  if (level === 'High') return '#C0392B';
  if (level === 'Medium') return '#D68910';
  return '#27AE60';
}
