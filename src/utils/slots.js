import { parkingAreas } from '../data/parkingAreas';

const LEGACY_SLOT_ID = /^slot-\d+$/;

export function isLegacySlotId(value) {
  return typeof value === 'string' && LEGACY_SLOT_ID.test(value);
}

export function getAreaName(slot) {
  if (!slot) return '';
  return slot.areaName || slot.parkingArea || '';
}

export function getSlotDisplayName(slot) {
  if (!slot) return '';

  const candidate = slot.slotName || slot.slotId || '';
  if (candidate && !isLegacySlotId(candidate)) {
    return candidate;
  }

  return '';
}

export function filterSlotsByArea(slots, areaName) {
  if (!areaName) return [];
  return slots.filter((slot) => getAreaName(slot) === areaName && getSlotDisplayName(slot));
}

export function sortSlotsForDisplay(slots) {
  const areaOrder = parkingAreas.map((area) => area.name);

  return [...slots].sort((left, right) => {
    const leftAreaIndex = areaOrder.indexOf(getAreaName(left));
    const rightAreaIndex = areaOrder.indexOf(getAreaName(right));
    const safeLeftArea = leftAreaIndex === -1 ? areaOrder.length : leftAreaIndex;
    const safeRightArea = rightAreaIndex === -1 ? areaOrder.length : rightAreaIndex;

    if (safeLeftArea !== safeRightArea) {
      return safeLeftArea - safeRightArea;
    }

    return getSlotDisplayName(left).localeCompare(getSlotDisplayName(right), undefined, {
      numeric: true,
    });
  });
}
