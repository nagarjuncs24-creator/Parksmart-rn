import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { subscribeAuth } from './src/services/auth';
import { checkAdminAccess } from './src/services/firestore';
import { initNotifications } from './src/services/notifications';

import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import BookingScreen from './src/screens/BookingScreen';
import ConfirmationScreen from './src/screens/ConfirmationScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import TicketScreen from './src/screens/TicketScreen';
import ReceiptScreen from './src/screens/ReceiptScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import BookingDetailsScreen from './src/screens/BookingDetailsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AdminScreen from './src/screens/AdminScreen';
import AccessDeniedScreen from './src/screens/AccessDeniedScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HistoryStack = createNativeStackNavigator();

function HistoryNavigator() {
  return (
    <HistoryStack.Navigator screenOptions={{ headerShown: false }}>
      <HistoryStack.Screen name="HistoryList" component={HistoryScreen} />
      <HistoryStack.Screen name="BookingDetails" component={BookingDetailsScreen} />
      <HistoryStack.Screen name="Receipt" component={ReceiptScreen} />
      <HistoryStack.Screen name="Notifications" component={NotificationsScreen} />
    </HistoryStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Booking" component={BookingScreen} options={{ tabBarLabel: 'Booking' }} />
      <Tab.Screen name="History" component={HistoryNavigator} options={{ tabBarLabel: 'History' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    initNotifications().catch(() => {});
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeAuth((currentUser) => {
      async function resolveRole() {
        if (!currentUser) {
          setUser(null);
          setUserRole(null);
          setAuthReady(true);
          return;
        }
        try {
          const isAdmin = await checkAdminAccess(currentUser.email);
          setUserRole(isAdmin ? 'admin' : 'user');
        } catch (error) {
          setUserRole('user');
        }
        setUser(currentUser);
        setAuthReady(true);
        initNotifications().catch(() => {});
      }
      resolveRole();
    });

    return unsubscribe;
  }, []);

  if (!authReady) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash">{(props) => <SplashScreen {...props} user={user} userRole={userRole} />}</Stack.Screen>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={MainTabs} />
        <Stack.Screen name="Booking" component={BookingScreen} />
        <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="Receipt" component={ReceiptScreen} />
        <Stack.Screen name="Ticket" component={TicketScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminScreen} />
        <Stack.Screen name="AccessDenied" component={AccessDeniedScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
