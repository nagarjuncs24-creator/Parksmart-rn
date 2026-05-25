import parkingAreas from './parkingAreas.json';

export { parkingAreas };

export function flattenAreaSlots() {
  return parkingAreas.flatMap((area) =>
    area.slots.map((slotName) => ({
      slotId: slotName,
      parkingArea: area.name,
      areaKey: area.id,
      latitude: area.latitude,
      longitude: area.longitude,
      status: 'available',
    }))
  );
}

export function getAreaSlotNames(areaName) {
  const area = parkingAreas.find((entry) => entry.name === areaName);
  return area?.slots || [];
}

export function getDefaultPrefixForArea(areaName) {
  const area = parkingAreas.find((entry) => entry.name === areaName);
  if (area?.slotPrefix) return area.slotPrefix;
  if (area?.slots?.[0]) {
    return area.slots[0].replace(/\d+$/, '');
  }
  return 'A';
}

export function getParkingAreaByName(areaName) {
  return parkingAreas.find((entry) => entry.name === areaName) || null;
}

export function getNextAvailableSlotName(areaName, existingSlots = []) {
  const slotNames = getAreaSlotNames(areaName);
  const usedInArea = new Set(
    existingSlots
      .filter((slot) => (slot.areaName || slot.parkingArea) === areaName)
      .map((slot) => slot.slotName || slot.slotId)
      .filter(Boolean)
  );
  return slotNames.find((name) => !usedInArea.has(name)) || null;
}
