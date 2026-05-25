import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../constants/theme';
import { parkingAreas } from '../../data/parkingAreas';
import { SLOT_STATUSES, TRAFFIC_OPTIONS, validateSlotUpdateForm } from '../../utils/slotGeneration';
import { getAreaName, getSlotDisplayName } from '../../utils/slots';

export default function EditSlotModal({ visible, slot, onClose, onSubmit, existingSlots = [], submitting }) {
  const [form, setForm] = useState({
    areaName: '',
    slotName: '',
    status: 'available',
    trafficLevel: 'Medium',
    pricePerHour: '50',
    evCharging: false,
    largeVehicle: false,
  });
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (!visible || !slot) return;
    setForm({
      areaName: getAreaName(slot),
      slotName: getSlotDisplayName(slot),
      status: slot.status || 'available',
      trafficLevel: slot.trafficLevel || 'Medium',
      pricePerHour: String(slot.price ?? slot.pricePerHour ?? 50),
      evCharging: !!(slot.evCharging ?? slot.evSupport),
      largeVehicle: !!slot.largeVehicle,
    });
    setErrors([]);
  }, [visible, slot]);

  const handleSubmit = () => {
    const validation = validateSlotUpdateForm(form, slot, existingSlots);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors([]);
    onSubmit(form);
  };

  if (!slot) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Edit slot</Text>
            <Text style={styles.subtitle}>{getSlotDisplayName(slot)} · {getAreaName(slot)}</Text>

            <Text style={styles.label}>Parking area</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {parkingAreas.map((area) => (
                <Pressable
                  key={area.id}
                  style={[styles.chip, form.areaName === area.name && styles.chipActive]}
                  onPress={() => setForm((prev) => ({ ...prev, areaName: area.name }))}
                >
                  <Text style={[styles.chipText, form.areaName === area.name && styles.chipTextActive]}>
                    {area.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.label}>Slot name</Text>
            <TextInput
              style={styles.input}
              value={form.slotName}
              onChangeText={(slotName) => setForm((prev) => ({ ...prev, slotName }))}
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Status</Text>
            <View style={styles.chipRow}>
              {SLOT_STATUSES.map((status) => (
                <Pressable
                  key={status}
                  style={[styles.chip, form.status === status && styles.chipActive]}
                  onPress={() => setForm((prev) => ({ ...prev, status }))}
                >
                  <Text style={[styles.chipText, form.status === status && styles.chipTextActive]}>
                    {status}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Traffic level</Text>
            <View style={styles.chipRow}>
              {TRAFFIC_OPTIONS.map((level) => (
                <Pressable
                  key={level}
                  style={[styles.chip, form.trafficLevel === level && styles.chipActive]}
                  onPress={() => setForm((prev) => ({ ...prev, trafficLevel: level }))}
                >
                  <Text style={[styles.chipText, form.trafficLevel === level && styles.chipTextActive]}>{level}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Price per hour (₹)</Text>
            <TextInput
              style={styles.input}
              value={form.pricePerHour}
              onChangeText={(pricePerHour) => setForm((prev) => ({ ...prev, pricePerHour }))}
              keyboardType="numeric"
            />

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>EV charging</Text>
              <Switch
                value={form.evCharging}
                onValueChange={(evCharging) => setForm((prev) => ({ ...prev, evCharging }))}
                trackColor={{ true: colors.primary }}
              />
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Large vehicle</Text>
              <Switch
                value={form.largeVehicle}
                onValueChange={(largeVehicle) => setForm((prev) => ({ ...prev, largeVehicle }))}
                trackColor={{ true: colors.primary }}
              />
            </View>

            {errors.length > 0 && (
              <View style={styles.errorBox}>
                {errors.map((error) => (
                  <Text key={error} style={styles.errorText}>
                    • {error}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.actions}>
              <Pressable style={styles.cancelButton} onPress={onClose} disabled={submitting}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Save changes</Text>}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    backgroundColor: colors.panel,
    borderRadius: 24,
    maxHeight: '90%',
  },
  content: {
    padding: 22,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    color: colors.secondaryText,
    marginBottom: 16,
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondaryText,
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: colors.background,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  chipText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: '#fff',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.text,
    fontWeight: '700',
  },
  submitButton: {
    flex: 1.4,
    borderRadius: 16,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
  },
});
