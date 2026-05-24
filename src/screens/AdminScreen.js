import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { colors } from '../constants/theme';
import { getCurrentUser } from '../services/auth';
import {
  createSlotsBatch,
  removeSlot,
  updateSlot,
  updateBooking,
  getParkingStats,
  getParkingAnalytics,
  createParkingArea,
  removeParkingArea,
  updateParkingArea,
  cancelBooking,
  completeBooking,
  checkAdminAccess,
  subscribeToSlotsRealtime,
  subscribeToBookingsRealtime,
  subscribeToParkingAreasRealtime,
  subscribeToUsersRealtime,
} from '../services/firestore';
import StatCard from '../components/StatCard';
import { parkingAreas, getParkingAreaByName } from '../data/parkingAreas';
import { getAreaName } from '../utils/slots';
import { SLOT_STATUSES } from '../utils/slotGeneration';
import { getAllAreaStatistics } from '../utils/adminAnalytics';
import CreateSlotModal from '../components/admin/CreateSlotModal';
import EditSlotModal from '../components/admin/EditSlotModal';
import SlotAdminCard from '../components/admin/SlotAdminCard';
import AreaStatsCard from '../components/admin/AreaStatsCard';
import AdminToast from '../components/admin/AdminToast';

const SLOT_FILTERS = ['all', ...SLOT_STATUSES, 'entered'];

export default function AdminScreen({ navigation }) {
  const [slots, setSlots] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [areas, setAreas] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    totalBookings: 0,
    activeBookings: 0,
    cancelledBookings: 0,
    availableSlots: 0,
    occupiedSlots: 0,
    peakBookingHour: 'No bookings yet',
    peakBookingCount: 0,
  });
  const [analytics, setAnalytics] = useState({
    totalBookings: 0,
    activeBookings: 0,
    dailyRevenue: 0,
    occupancyPercentage: 0,
    peakHour: 'No data',
    quietHour: 'No data',
  });
  const [slotFilter, setSlotFilter] = useState('all');
  const [areaStatsFilter, setAreaStatsFilter] = useState(parkingAreas[0]?.name || '');
  const [loading, setLoading] = useState(true);
  const [adminReady, setAdminReady] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type }), 3200);
  };

  const refreshStats = async () => {
    try {
      const result = await getParkingStats();
      setStats(result);
      const analyticsResult = await getParkingAnalytics();
      setAnalytics(analyticsResult);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      return;
    }

    const verifyAdmin = async () => {
      try {
        const isAdmin = await checkAdminAccess(currentUser.email);
        if (!isAdmin) {
          navigation.replace('AccessDenied');
          return;
        }
        setAdminReady(true);
      } catch (error) {
        Alert.alert('Access error', error.message);
      }
    };
    verifyAdmin();
  }, [navigation]);

  useEffect(() => {
    if (!adminReady) return;

    setLoading(true);
    const unsubscribeSlots = subscribeToSlotsRealtime((slotList) => {
      setSlots(slotList);
    });
    const unsubscribeBookings = subscribeToBookingsRealtime((bookingList) => {
      setBookings(bookingList);
    });
    const unsubscribeUsers = subscribeToUsersRealtime((userList) => {
      setUsers(userList);
    });
    const unsubscribeAreas = subscribeToParkingAreasRealtime((areaList) => {
      setAreas(areaList);
    });

    refreshStats().finally(() => setLoading(false));
    return () => {
      unsubscribeSlots();
      unsubscribeBookings();
      unsubscribeUsers();
      unsubscribeAreas();
    };
  }, [adminReady]);

  useEffect(() => {
    if (!adminReady) return;
    refreshStats();
  }, [slots, bookings, adminReady]);

  const filteredSlots = useMemo(() => {
    if (slotFilter === 'all') return slots;
    return slots.filter((slot) => slot.status === slotFilter);
  }, [slots, slotFilter]);

  const areaStatistics = useMemo(
    () => getAllAreaStatistics(slots, bookings, parkingAreas.map((area) => area.name)),
    [slots, bookings]
  );

  const selectedAreaStats = areaStatistics.find((entry) => entry.areaName === areaStatsFilter);

  const handleCreateSlots = async (form) => {
    const area = getParkingAreaByName(form.areaName);
    if (!area) {
      showToast('Invalid parking area selected.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = form.slotNames.map((slotName) => ({
        areaName: form.areaName,
        slotName,
        status: 'available',
        price: Number(form.pricePerHour),
        trafficLevel: form.trafficLevel,
        evCharging: form.evCharging,
        largeVehicle: form.largeVehicle,
        capacity: Number(form.capacity) || 1,
        areaKey: area.id,
        latitude: area.latitude,
        longitude: area.longitude,
      }));

      await createSlotsBatch(payload);
      setCreateModalVisible(false);
      showToast(`Created ${payload.length} slot(s) in ${form.areaName}.`);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSlot = async (form) => {
    if (!editingSlot) return;
    setSubmitting(true);
    try {
      await updateSlot(editingSlot.id, {
        areaName: form.areaName,
        slotName: form.slotName.trim(),
        status: form.status,
        trafficLevel: form.trafficLevel,
        price: Number(form.pricePerHour),
        evCharging: form.evCharging,
        largeVehicle: form.largeVehicle,
      });
      setEditModalVisible(false);
      setEditingSlot(null);
      showToast(`Slot ${form.slotName} updated.`);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = (slotId) => {
    Alert.alert('Delete slot', 'Remove this slot from inventory?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeSlot(slotId);
            showToast('Slot deleted.');
          } catch (error) {
            showToast(error.message, 'error');
          }
        },
      },
    ]);
  };

  const handleStatusCycle = async (slot) => {
    const currentIndex = SLOT_STATUSES.indexOf(slot.status);
    const nextStatus = SLOT_STATUSES[(currentIndex + 1) % SLOT_STATUSES.length] || 'available';
    try {
      await updateSlot(slot.id, { status: nextStatus });
      showToast(`${slot.slotName || slot.slotId} → ${nextStatus}`);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleAddArea = async () => {
    const areaId = `area-${Date.now()}`;
    try {
      await createParkingArea({
        name: `New Parking ${areaId}`,
        latitude: 12.9716 + Math.random() * 0.02,
        longitude: 77.5946 + Math.random() * 0.02,
        capacity: 40,
        availableSlots: 40,
        occupiedSlots: 0,
        reservedSlots: 0,
        pricePerHour: 60,
        evSupport: false,
        largeVehicle: false,
        description: 'Add coordinates and pricing details here.',
      });
      showToast('Parking area added.');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleToggleAreaFeature = async (area, field) => {
    try {
      await updateParkingArea(area.id, { [field]: !area[field] });
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleRemoveArea = async (areaId) => {
    Alert.alert('Remove area', 'Delete this parking area?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeParkingArea(areaId);
            showToast('Parking area removed.');
          } catch (error) {
            showToast(error.message, 'error');
          }
        },
      },
    ]);
  };

  const handleVerifyBooking = async (booking) => {
    try {
      const bookingState = booking.bookingStatus || booking.status;
      if (bookingState === 'cancelled' || bookingState === 'completed') {
        Alert.alert('Cannot verify', 'This booking is already closed.');
        return;
      }
      await updateBooking(booking.id, { status: 'entered', bookingStatus: 'entered' });
      if (booking.slotId) {
        await updateSlot(booking.slotId, { status: 'entered' });
      }
      showToast(`Booking ${booking.bookingId} marked entered.`);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleCancelBooking = async (booking) => {
    try {
      await cancelBooking(booking.id);
      showToast(`Booking ${booking.bookingId} cancelled.`);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleCompleteBooking = async (booking) => {
    try {
      await completeBooking(booking.id);
      showToast(`Booking ${booking.bookingId} completed.`);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  if (!adminReady || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading admin dashboard…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView style={styles.page} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Manage parking areas, slots, and live inventory.</Text>

        <View style={styles.summaryRow}>
          <StatCard label="Users" value={stats.totalUsers.toString()} accent={colors.primary} />
          <StatCard label="Bookings" value={analytics.totalBookings.toString()} accent={colors.success} />
          <StatCard label="Active" value={analytics.activeBookings.toString()} accent={colors.success} />
        </View>

        <View style={styles.summaryRow}>
          <StatCard label="Revenue" value={`₹${analytics.dailyRevenue}`} accent={colors.primary} />
          <StatCard label="Occupancy" value={`${analytics.occupancyPercentage}%`} accent={colors.warning} />
        </View>

        <View style={styles.summaryRow}>
          <StatCard label="Cancelled" value={stats.cancelledBookings.toString()} accent={colors.danger} />
          <StatCard label="Peak hour" value={analytics.peakHour} accent={colors.warning} />
        </View>

        <View style={styles.createSection}>
          <Text style={styles.sectionTitle}>Create slots</Text>
          <Text style={styles.sectionHint}>
            Select area, prefix, and count — slots like A1, B2 are generated and saved to Firebase.
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => setCreateModalVisible(true)}>
            <Text style={styles.primaryButtonText}>+ Open slot creator</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Area statistics</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {parkingAreas.map((area) => (
            <Pressable
              key={area.id}
              style={[styles.filterChip, areaStatsFilter === area.name && styles.filterChipActive]}
              onPress={() => setAreaStatsFilter(area.name)}
            >
              <Text style={[styles.filterText, areaStatsFilter === area.name && styles.filterTextActive]}>
                {area.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        {selectedAreaStats && <AreaStatsCard stats={selectedAreaStats} />}

        <Pressable style={styles.secondaryButton} onPress={handleAddArea}>
          <Text style={styles.secondaryButtonText}>Add parking area (Firestore)</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Managed parking areas</Text>
        {areas.length === 0 ? (
          <Text style={styles.emptyText}>No Firestore parking areas yet.</Text>
        ) : (
          areas.map((area) => (
            <View key={area.id} style={styles.card}>
              <Text style={styles.cardTitle}>{area.name}</Text>
              <Text style={styles.cardMeta}>{area.description || 'Smart parking area'}</Text>
              <Text style={styles.cardText}>Price: ₹{area.pricePerHour}/hr</Text>
              <View style={styles.buttonRow}>
                <Pressable style={styles.actionButton} onPress={() => handleToggleAreaFeature(area, 'evSupport')}>
                  <Text style={styles.actionText}>{area.evSupport ? 'EV off' : 'EV on'}</Text>
                </Pressable>
                <Pressable style={styles.actionButton} onPress={() => handleToggleAreaFeature(area, 'largeVehicle')}>
                  <Text style={styles.actionText}>{area.largeVehicle ? 'Large off' : 'Large on'}</Text>
                </Pressable>
                <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={() => handleRemoveArea(area.id)}>
                  <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Slot inventory ({filteredSlots.length})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {SLOT_FILTERS.map((filter) => (
            <Pressable
              key={filter}
              style={[styles.filterChip, slotFilter === filter && styles.filterChipActive]}
              onPress={() => setSlotFilter(filter)}
            >
              <Text style={[styles.filterText, slotFilter === filter && styles.filterTextActive]}>{filter}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {filteredSlots.length === 0 ? (
          <Text style={styles.emptyText}>No slots match this filter. Create slots to get started.</Text>
        ) : (
          filteredSlots.map((slot) => (
            <SlotAdminCard
              key={slot.id}
              slot={slot}
              onEdit={(item) => {
                setEditingSlot(item);
                setEditModalVisible(true);
              }}
              onDelete={handleDeleteSlot}
              onStatusCycle={handleStatusCycle}
            />
          ))
        )}

        <Text style={styles.sectionTitle}>Latest bookings</Text>
        {bookings.length === 0 ? (
          <Text style={styles.emptyText}>No bookings yet.</Text>
        ) : (
          bookings.slice(0, 6).map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <Text style={styles.cardTitle}>{booking.parkingArea || getAreaName(booking)}</Text>
              <Text style={styles.cardText}>Slot ref: {booking.slotId}</Text>
              <Text style={styles.cardText}>User: {booking.userName || booking.userId}</Text>
              <Text style={styles.cardText}>Status: {booking.bookingStatus || booking.status}</Text>
              <Text style={styles.cardText}>Price: ₹{booking.totalPrice || 0}</Text>
              <View style={styles.buttonRow}>
                <Pressable style={styles.actionButton} onPress={() => handleVerifyBooking(booking)}>
                  <Text style={styles.actionText}>Verify QR</Text>
                </Pressable>
                <Pressable style={styles.actionButton} onPress={() => handleCancelBooking(booking)}>
                  <Text style={styles.actionText}>Cancel</Text>
                </Pressable>
                <Pressable style={[styles.actionButton, styles.completeButton]} onPress={() => handleCompleteBooking(booking)}>
                  <Text style={styles.actionText}>Complete</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Users</Text>
        {users.length === 0 ? (
          <Text style={styles.emptyText}>No users yet.</Text>
        ) : (
          users.slice(0, 4).map((user) => (
            <View key={user.uid} style={styles.bookingCard}>
              <Text style={styles.cardTitle}>{user.name || 'Unnamed'}</Text>
              <Text style={styles.cardText}>{user.email}</Text>
              <Text style={styles.cardText}>Role: {user.role || 'user'}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <CreateSlotModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={handleCreateSlots}
        existingSlots={slots}
        submitting={submitting}
      />

      <EditSlotModal
        visible={editModalVisible}
        slot={editingSlot}
        onClose={() => {
          setEditModalVisible(false);
          setEditingSlot(null);
        }}
        onSubmit={handleEditSlot}
        existingSlots={slots}
        submitting={submitting}
      />

      <AdminToast message={toast.message} type={toast.type} visible={toast.visible} />
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
    paddingBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.secondaryText,
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  createSection: {
    backgroundColor: colors.primaryLight,
    borderRadius: 22,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
    marginTop: 8,
  },
  sectionHint: {
    fontSize: 13,
    color: colors.secondaryText,
    marginBottom: 14,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: colors.panel,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  filterScroll: {
    marginBottom: 14,
  },
  filterChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 10,
    backgroundColor: colors.panel,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  filterText: {
    color: colors.text,
    fontWeight: '700',
    textTransform: 'capitalize',
    fontSize: 12,
  },
  filterTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookingCard: {
    backgroundColor: colors.panel,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  cardMeta: {
    fontSize: 13,
    color: colors.secondaryText,
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    color: colors.secondaryText,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flex: 1,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: colors.dangerLight,
  },
  completeButton: {
    backgroundColor: colors.primaryDark,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  deleteText: {
    color: colors.danger,
  },
  emptyText: {
    color: colors.secondaryText,
    marginBottom: 16,
    lineHeight: 20,
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
});
