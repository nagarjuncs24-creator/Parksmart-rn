const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('Missing Firebase service account file.');
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path, or place serviceAccountKey.json inside scripts/.');
  console.error(`Expected path: ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
const parkingAreas = require('../src/data/parkingAreas.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seedParkingAreas() {
  for (const area of parkingAreas) {
    const areaRef = db.collection('parkingAreas').doc(area.id);
    const { slots, id, ...areaData } = area;
    await areaRef.set(
      {
        ...areaData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`Parking area ready: ${area.name}`);
  }
}

async function seedParkingSlots() {
  const snapshot = await db.collection('parkingSpots').get();
  const existingKeys = new Set(
    snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return `${data.parkingArea || ''}:${data.slotId || ''}`;
    })
  );

  let created = 0;

  for (const area of parkingAreas) {
    for (const slotName of area.slots) {
      const key = `${area.name}:${slotName}`;
      if (existingKeys.has(key)) {
        console.log(`Skipping existing slot: ${area.name} ${slotName}`);
        continue;
      }

      await db.collection('parkingSpots').add({
        areaName: area.name,
        slotName,
        slotId: slotName,
        parkingArea: area.name,
        areaKey: area.id,
        latitude: area.latitude,
        longitude: area.longitude,
        status: 'available',
        price: area.pricePerHour || 50,
        pricePerHour: area.pricePerHour || 50,
        trafficLevel: 'Medium',
        evCharging: !!area.evSupport,
        largeVehicle: !!area.largeVehicle,
        capacity: 1,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      existingKeys.add(key);
      created += 1;
      console.log(`Created slot: ${area.name} ${slotName}`);
    }
  }

  console.log(`Seeded ${created} new parking slot(s).`);
}

async function run() {
  try {
    await seedParkingAreas();
    await seedParkingSlots();
    console.log('Parking areas and slots are ready.');
  } catch (error) {
    console.error('Failed to seed parking data:', error);
    process.exit(1);
  }
}

run();
