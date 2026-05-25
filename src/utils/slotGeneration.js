export const SLOT_STATUSES = ['available', 'occupied', 'reserved', 'maintenance'];

export const TRAFFIC_OPTIONS = ['Low', 'Medium', 'High'];

export function generateSlotNames(prefix, count, startIndex = 1) {
  const cleanPrefix = (prefix || 'A').trim().toUpperCase().replace(/[^A-Z]/g, '');
  const safePrefix = cleanPrefix || 'A';
  const total = Math.max(0, Math.min(Number(count) || 0, 50));

  return Array.from({ length: total }, (_, index) => `${safePrefix}${startIndex + index}`);
}

export function findDuplicateSlotNames(areaName, slotNames, existingSlots = []) {
  const used = new Set(
    existingSlots
      .filter((slot) => (slot.areaName || slot.parkingArea) === areaName)
      .map((slot) => (slot.slotName || slot.slotId || '').trim())
      .filter(Boolean)
  );

  return slotNames.filter((name) => used.has(name));
}

export function validateSlotCreationForm(form, existingSlots = []) {
  const errors = [];
  const areaName = (form.areaName || '').trim();
  const prefix = (form.prefix || '').trim();
  const count = Number(form.slotCount);
  const price = Number(form.pricePerHour);
  const capacity = Number(form.capacity);

  if (!areaName) {
    errors.push('Select a parking area.');
  }

  if (!prefix || !/^[A-Za-z]{1,2}$/.test(prefix)) {
    errors.push('Slot prefix must be 1–2 letters (e.g. A, B, C).');
  }

  if (!Number.isFinite(count) || count < 1 || count > 50) {
    errors.push('Number of slots must be between 1 and 50.');
  }

  if (!Number.isFinite(price) || price <= 0) {
    errors.push('Price per hour must be greater than 0.');
  }

  if (!Number.isFinite(capacity) || capacity < 1) {
    errors.push('Capacity must be at least 1.');
  }

  if (!TRAFFIC_OPTIONS.includes(form.trafficLevel)) {
    errors.push('Select a valid traffic level.');
  }

  if (!errors.length && areaName && prefix && count) {
    const proposed = generateSlotNames(prefix, count);
    const duplicates = findDuplicateSlotNames(areaName, proposed, existingSlots);
    if (duplicates.length) {
      errors.push(`Duplicate slot names: ${duplicates.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    slotNames: errors.length ? [] : generateSlotNames(prefix, count),
  };
}

export function validateSlotUpdateForm(form, slot, existingSlots = []) {
  const errors = [];
  const areaName = (form.areaName || '').trim();
  const slotName = (form.slotName || '').trim();
  const price = Number(form.pricePerHour);

  if (!areaName) {
    errors.push('Area name is required.');
  }

  if (!slotName) {
    errors.push('Slot name is required.');
  }

  if (!Number.isFinite(price) || price <= 0) {
    errors.push('Price per hour must be greater than 0.');
  }

  if (!SLOT_STATUSES.includes(form.status)) {
    errors.push('Select a valid slot status.');
  }

  const duplicate = existingSlots.find((entry) => {
    if (entry.id === slot?.id) return false;
    const entryArea = entry.areaName || entry.parkingArea;
    const entryName = entry.slotName || entry.slotId;
    return entryArea === areaName && entryName === slotName;
  });

  if (duplicate) {
    errors.push(`Slot ${slotName} already exists in ${areaName}.`);
  }

  return { valid: errors.length === 0, errors };
}
