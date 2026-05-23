import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { subscribeAuth } from './src/services/auth';
import { checkAdminAccess } from './src/services/firestore';

import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import BookingScreen from './src/screens/BookingScreen';
import ConfirmationScreen from './src/screens/ConfirmationScreen';
import TicketScreen from './src/screens/TicketScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AdminScreen from './src/screens/AdminScreen';
import AccessDeniedScreen from './src/screens/AccessDeniedScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [authReady, setAuthReady] = useState(false);

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
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Booking" component={BookingScreen} />
        <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
        <Stack.Screen name="Ticket" component={TicketScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminScreen} />
        <Stack.Screen name="AccessDenied" component={AccessDeniedScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
