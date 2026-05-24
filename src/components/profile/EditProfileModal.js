import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../constants/theme';
import { getInitials } from '../../utils/profileFormat';

const VEHICLE_TYPES = ['Car', 'Bike', 'SUV', 'EV', 'Other'];

export default function EditProfileModal({ visible, profile, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    vehicleNumber: '',
    vehicleType: 'Car',
    profileImageUrl: '',
    localImageUri: null,
  });

  useEffect(() => {
    if (!visible) return;
    setForm({
      name: profile?.name || '',
      phone: profile?.phone || '',
      vehicleNumber: profile?.vehicleNumber || '',
      vehicleType: profile?.vehicleType || 'Car',
      profileImageUrl: profile?.profileImageUrl || '',
      localImageUri: null,
    });
  }, [visible, profile]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to update your profile image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setForm((prev) => ({ ...prev, localImageUri: result.assets[0].uri }));
    }
  };

  const avatarUri = form.localImageUri || form.profileImageUrl;

  const handleSubmit = () => {
    if (!form.name.trim()) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }
    onSave(form);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Edit profile</Text>

            <Pressable style={styles.avatarWrap} onPress={pickImage}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{getInitials(form.name)}</Text>
                </View>
              )}
              <Text style={styles.changePhoto}>Change photo</Text>
            </Pressable>

            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(name) => setForm((prev) => ({ ...prev, name }))}
              placeholder="Your name"
            />

            <Text style={styles.label}>Phone number</Text>
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={(phone) => setForm((prev) => ({ ...prev, phone }))}
              keyboardType="phone-pad"
              placeholder="10-digit mobile"
            />

            <Text style={styles.label}>Vehicle number</Text>
            <TextInput
              style={styles.input}
              value={form.vehicleNumber}
              onChangeText={(vehicleNumber) => setForm((prev) => ({ ...prev, vehicleNumber }))}
              autoCapitalize="characters"
              placeholder="KA 01 AB 1234"
            />

            <Text style={styles.label}>Vehicle type</Text>
            <View style={styles.chipRow}>
              {VEHICLE_TYPES.map((type) => (
                <Pressable
                  key={type}
                  style={[styles.chip, form.vehicleType === type && styles.chipActive]}
                  onPress={() => setForm((prev) => ({ ...prev, vehicleType: type }))}
                >
                  <Text style={[styles.chipText, form.vehicleType === type && styles.chipTextActive]}>{type}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.cancelBtn} onPress={onClose} disabled={saving}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={handleSubmit} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save profile</Text>}
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
    marginBottom: 18,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  changePhoto: {
    marginTop: 10,
    color: colors.primary,
    fontWeight: '700',
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
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
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
  saveBtn: {
    flex: 1.4,
    borderRadius: 16,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
  },
});
