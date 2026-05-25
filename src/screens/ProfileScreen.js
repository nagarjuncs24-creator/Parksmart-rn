import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { logout, getCurrentUser, updateAuthUserProfile } from '../services/auth';
import {
  checkAdminAccess,
  subscribeToUserProfileRealtime,
  subscribeToUserBookingsRealtime,
  subscribeToSlotsRealtime,
  updateUserProfile,
  getSlotById,
} from '../services/firestore';
import { uploadProfileImage } from '../services/storage';
import { getInitials, formatJoinedDate, parseTimestamp } from '../utils/profileFormat';
import {
  computeUserBookingStats,
  getActiveBooking,
  getProfileRecommendations,
} from '../utils/profileStats';
import AnimatedStatCard from '../components/profile/AnimatedStatCard';
import ActiveBookingCard from '../components/profile/ActiveBookingCard';
import BookingHistoryItem from '../components/profile/BookingHistoryItem';
import RecommendationsSection from '../components/profile/RecommendationsSection';
import EditProfileModal from '../components/profile/EditProfileModal';
import LogoutConfirmModal from '../components/profile/LogoutConfirmModal';

function DetailRow({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={colors.primary} style={styles.detailIcon} />
      <View style={styles.detailBody}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [role, setRole] = useState('User');
  const [loading, setLoading] = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [countdown, setCountdown] = useState(null);

  const activeBooking = useMemo(() => getActiveBooking(bookings), [bookings]);
  const stats = useMemo(() => computeUserBookingStats(bookings), [bookings]);
  const recommendations = useMemo(() => getProfileRecommendations(bookings, slots), [bookings, slots]);
  const historyBookings = useMemo(
    () => bookings.filter((booking) => booking.id !== activeBooking?.id).slice(0, 8),
    [bookings, activeBooking]
  );

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      return;
    }

    setAuthUser(currentUser);

    const unsubProfile = subscribeToUserProfileRealtime(currentUser.uid, (data) => {
      setProfile(
        data || {
          uid: currentUser.uid,
          name: currentUser.displayName || 'ParkSmart User',
          email: currentUser.email,
        }
      );
      setLoading(false);
    });

    const unsubBookings = subscribeToUserBookingsRealtime(currentUser.uid, setBookings);
    const unsubSlots = subscribeToSlotsRealtime(setSlots);

    checkAdminAccess(currentUser.email).then((isAdmin) => {
      setRole(isAdmin ? 'Admin' : 'User');
    });

    return () => {
      unsubProfile();
      unsubBookings();
      unsubSlots();
    };
  }, [navigation]);

  useEffect(() => {
    let interval;
    if (!activeBooking?.slotId) {
      setActiveSlot(null);
      setCountdown(null);
      return undefined;
    }

    getSlotById(activeBooking.slotId).then(setActiveSlot);

    const expiresAt = activeBooking.expiresAt;
    if (expiresAt) {
      const expiryDate = parseTimestamp(expiresAt);
      const tick = () => {
        const diff = Math.max(0, Math.floor((expiryDate.getTime() - Date.now()) / 1000));
        setCountdown(diff);
      };
      tick();
      interval = setInterval(tick, 1000);
    } else {
      setCountdown(null);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeBooking]);

  const displayName = profile?.name || authUser?.displayName || 'ParkSmart User';
  const email = profile?.email || authUser?.email || '';
  const avatarUri = profile?.profileImageUrl || authUser?.photoURL || '';

  const handleSaveProfile = async (form) => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    setSaving(true);
    try {
      let profileImageUrl = form.profileImageUrl;

      if (form.localImageUri) {
        profileImageUrl = await uploadProfileImage(currentUser.uid, form.localImageUri);
      }

      await updateUserProfile(currentUser.uid, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
        vehicleType: form.vehicleType,
        profileImageUrl,
      });

      await updateAuthUserProfile({
        displayName: form.name.trim(),
        photoURL: profileImageUrl || null,
      });

      setEditVisible(false);
      Alert.alert('Profile updated', 'Your details have been saved.');
    } catch (error) {
      Alert.alert('Update failed', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setLogoutVisible(false);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      Alert.alert('Logout failed', error.message);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleNavigate = () => {
    const lat = activeSlot?.latitude;
    const lon = activeSlot?.longitude;
    if (!lat || !lon) {
      Alert.alert('Navigation unavailable', 'Location coordinates are missing for this booking.');
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`;
    Linking.openURL(url).catch(() => Alert.alert('Unable to open maps'));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your profile…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar backgroundColor={colors.primaryDark} barStyle="light-content" />
      <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
            </View>
          )}
          <Text style={styles.heroName}>{displayName}</Text>
          <Text style={styles.heroEmail}>{email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{role}</Text>
          </View>
          <Pressable style={styles.editButton} onPress={() => setEditVisible(true)}>
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.editButtonText}>Edit profile</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account details</Text>
          <DetailRow icon="call-outline" label="Phone" value={profile?.phone} />
          <DetailRow icon="car-outline" label="Vehicle number" value={profile?.vehicleNumber} />
          <DetailRow icon="speedometer-outline" label="Vehicle type" value={profile?.vehicleType || 'Car'} />
          <DetailRow icon="calendar-outline" label="Joined" value={formatJoinedDate(profile?.createdAt)} />
          <DetailRow icon="finger-print-outline" label="User ID" value={profile?.uid} />
        </View>

        <Text style={styles.sectionTitle}>Parking statistics</Text>
        <View style={styles.statsGrid}>
          <AnimatedStatCard label="Total" value={String(stats.total)} delay={0} />
          <AnimatedStatCard label="Active" value={String(stats.active)} accent={colors.primary} delay={80} />
          <AnimatedStatCard label="Done" value={String(stats.completed)} accent={colors.success} delay={160} />
        </View>
        <View style={styles.statsGrid}>
          <AnimatedStatCard label="Cancelled" value={String(stats.cancelled)} accent={colors.danger} delay={240} />
          <AnimatedStatCard label="Spent" value={`₹${stats.totalSpent}`} accent={colors.primaryDark} delay={320} />
          <AnimatedStatCard label="Favorite" value={stats.favoriteArea} delay={400} />
        </View>

        <ActiveBookingCard
          booking={activeBooking}
          slot={activeSlot}
          countdown={countdown}
          onNavigate={handleNavigate}
          onViewTicket={() => navigation.navigate('Ticket', { bookingId: activeBooking.id })}
        />

        <RecommendationsSection recommendations={recommendations} />

        <Text style={styles.sectionTitle}>Booking history</Text>
        {historyBookings.length === 0 && !activeBooking ? (
          <Text style={styles.emptyText}>No bookings yet. Reserve a slot from the Booking tab.</Text>
        ) : (
          historyBookings.map((booking) => <BookingHistoryItem key={booking.id} booking={booking} />)
        )}

        {bookings.length > 8 && (
          <Pressable style={styles.linkButton} onPress={() => navigation.navigate('History')}>
            <Text style={styles.linkText}>View all in History tab</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </Pressable>
        )}

        {role === 'Admin' && (
          <Pressable style={styles.adminButton} onPress={() => navigation.navigate('AdminDashboard')}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.adminButtonText}>Open admin dashboard</Text>
          </Pressable>
        )}

        <Pressable style={styles.logoutButton} onPress={() => setLogoutVisible(true)}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>

      <EditProfileModal
        visible={editVisible}
        profile={profile}
        onClose={() => setEditVisible(false)}
        onSave={handleSaveProfile}
        saving={saving}
      />

      <LogoutConfirmModal
        visible={logoutVisible}
        onCancel={() => setLogoutVisible(false)}
        onConfirm={handleLogout}
        loading={loggingOut}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: colors.secondaryText,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#1F8A4C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 12,
  },
  avatarInitials: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  heroEmail: {
    fontSize: 15,
    color: '#E8F8EE',
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 14,
  },
  roleText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryDark,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  detailIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  detailBody: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.secondaryText,
    marginBottom: 2,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 10,
    marginHorizontal: -4,
  },
  emptyText: {
    color: colors.secondaryText,
    marginBottom: 20,
    lineHeight: 20,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '700',
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: 18,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adminButtonText: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.danger,
    borderRadius: 18,
    paddingVertical: 16,
    marginTop: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
