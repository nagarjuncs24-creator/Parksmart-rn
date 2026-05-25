export function parseTimestamp(timestamp) {
  if (!timestamp) return null;
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
  return new Date(timestamp);
}

export function formatJoinedDate(timestamp) {
  const date = parseTimestamp(timestamp);
  if (!date || Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatBookingDate(timestamp) {
  const date = parseTimestamp(timestamp);
  if (!date || Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString();
}

export function formatDurationLabel(hours) {
  if (!hours) return '1 hour';
  if (hours >= 24) return 'Full day';
  if (hours === 1) return '1 hour';
  return `${hours} hours`;
}

export function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'PS';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function formatCountdown(seconds) {
  const safe = Math.max(0, seconds || 0);
  const minutes = Math.floor(safe / 60);
  const remaining = safe % 60;
  return `${minutes.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
}
