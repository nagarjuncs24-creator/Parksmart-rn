# ParkSmart - Real-time Parking Discovery & Management

A React Native mobile app connecting drivers with available parking spots in Bengaluru using real-time data, AI predictions, and community reporting.

## Features

- **Real-time Parking Map**: Display available parking spots with live status
- **Smart Booking**: Reserve spots by the hour with integrated payment
- **Community Reporting**: Report illegal parking and hazards
- **Booking History**: Track past bookings and spending
- **User Profiles**: Manage account and reputation scores
- **Payment Integration**: Stripe-based payment processing
- **AI Predictions**: Smart recommendations based on time and location

## Tech Stack

- **Frontend**: React Native 0.71 + Expo 48
- **Navigation**: React Navigation v6 with stack + tab navigation
- **Backend**: Firebase Firestore (database), Firebase Auth
- **Payments**: Stripe API
- **Maps**: React Native Maps
- **HTTP Client**: Axios

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- Expo CLI: `npm install -g expo-cli`
- Android emulator or physical device with Expo Go app
- Firebase project credentials
- Stripe API keys

### Installation

1. **Install dependencies**:
   ```bash
   cd ParkSmart-RN
   npm install
   ```

2. **Configure Firebase**:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Copy your config and update `src/config/firebase.js`

3. **Configure Stripe**:
   - Get your publishable key from [Stripe Dashboard](https://dashboard.stripe.com)
   - Update `src/config/stripe.js`

4. **Run the app**:
   ```bash
   npm start
   ```
   - Scan QR with Expo Go on device or run `npm run android`

## Project Structure

```
src/
├── screens/       # Login, Map, Booking, History, Profile, Report
├── services/      # Firebase, Auth, Payment, Predictions
├── models/        # Data models
├── config/        # Firebase & Stripe config
└── utils/         # ErrorBoundary component
```

## Database Schema

**parkingSpots**: `{ id, latitude, longitude, status, type, pricePerHour }`  
**bookings**: `{ spotId, userId, hours, totalPrice, status, createdAt }`  
**users**: `{ uid, email, name, phone, reputation }`  
**reports**: `{ userId, latitude, longitude, type, description, verified }`

## Next Steps

1. Add Firebase credentials to `src/config/firebase.js`
2. Add Stripe key to `src/config/stripe.js`
3. Configure Firestore rules for security
4. Implement admin panel screens
5. Add real-time location tracking

---

**Built with ❤️ for Bengaluru's parking crisis**
