import React, { useEffect, useMemo, useState } from 'react';
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
import { parkingAreas, getDefaultPrefixForArea, getParkingAreaByName } from '../../data/parkingAreas';
import { generateSlotNames, TRAFFIC_OPTIONS, validateSlotCreationForm } from '../../utils/slotGeneration';

const defaultForm = {
  areaName: parkingAreas[0]?.name || '',
  prefix: 'A',
  slotCount: '3',
  trafficLevel: 'Medium',
  pricePerHour: '50',
  capacity: '1',
  evCharging: false,
  largeVehicle: false,
};

export default function CreateSlotModal({ visible, onClose, onSubmit, existingSlots = [], submitting }) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (!visible) return;
    setForm({
      ...defaultForm,
      areaName: parkingAreas[0]?.name || '',
      prefix: getDefaultPrefixForArea(parkingAreas[0]?.name || ''),
    });
    setErrors([]);
  }, [visible]);

  const previewNames = useMemo(() => {
    const count = Number(form.slotCount) || 0;
    if (!form.prefix || count < 1) return [];
    return generateSlotNames(form.prefix, Math.min(count, 8));
  }, [form.prefix, form.slotCount]);

  const handleAreaSelect = (areaName) => {
    const area = getParkingAreaByName(areaName);
    setForm((prev) => ({
      ...prev,
      areaName,
      prefix: getDefaultPrefixForArea(areaName),
      pricePerHour: String(area?.pricePerHour || 50),
      evCharging: area?.evSupport || false,
      largeVehicle: area?.largeVehicle || false,
      capacity: String(area?.capacity || 1),
    }));
  };

  const handleSubmit = () => {
    const validation = validateSlotCreationForm(form, existingSlots);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors([]);
    onSubmit({ ...form, slotNames: validation.slotNames });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Create parking slots</Text>
            <Text style={styles.subtitle}>Generate area-based slots and sync to Firebase instantly.</Text>

            <Text style={styles.label}>Parking area</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {parkingAreas.map((area) => (
                <Pressable
                  key={area.id}
                  style={[styles.chip, form.areaName === area.name && styles.chipActive]}
                  onPress={() => handleAreaSelect(area.name)}
                >
                  <Text style={[styles.chipText, form.areaName === area.name && styles.chipTextActive]}>
                    {area.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Slot prefix</Text>
                <TextInput
                  style={styles.input}
                  value={form.prefix}
                  onChangeText={(prefix) => setForm((prev) => ({ ...prev, prefix }))}
                  autoCapitalize="characters"
                  maxLength={2}
                  placeholder="A"
                />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Number of slots</Text>
                <TextInput
                  style={styles.input}
                  value={form.slotCount}
                  onChangeText={(slotCount) => setForm((prev) => ({ ...prev, slotCount }))}
                  keyboardType="number-pad"
                  placeholder="3"
                />
              </View>
            </View>

            {previewNames.length > 0 && (
              <Text style={styles.preview}>Preview: {previewNames.join(', ')}{Number(form.slotCount) > 8 ? '…' : ''}</Text>
            )}

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

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Price per hour (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={form.pricePerHour}
                  onChangeText={(pricePerHour) => setForm((prev) => ({ ...prev, pricePerHour }))}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Capacity</Text>
                <TextInput
                  style={styles.input}
                  value={form.capacity}
                  onChangeText={(capacity) => setForm((prev) => ({ ...prev, capacity }))}
                  keyboardType="number-pad"
                />
              </View>
            </View>

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
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Create slots</Text>
                )}
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
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.panel,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
  },
  content: {
    padding: 22,
    paddingBottom: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    color: colors.secondaryText,
    marginBottom: 18,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondaryText,
    marginBottom: 8,
    marginTop: 8,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  chipScroll: {
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
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
    fontSize: 13,
  },
  chipTextActive: {
    color: '#fff',
  },
  preview: {
    fontSize: 13,
    color: colors.primaryDark,
    fontWeight: '600',
    marginBottom: 8,
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
