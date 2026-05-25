import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../constants/theme';

export default function LogoutConfirmModal({ visible, onCancel, onConfirm, loading }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Logout?</Text>
          <Text style={styles.message}>You will need to sign in again to access bookings and your profile.</Text>
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={loading}>
              <Text style={styles.cancelText}>Stay signed in</Text>
            </Pressable>
            <Pressable style={styles.confirmBtn} onPress={onConfirm} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Logout</Text>}
            </Pressable>
          </View>
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
    padding: 24,
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 24,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    color: colors.secondaryText,
    lineHeight: 22,
    marginBottom: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
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
  confirmBtn: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.danger,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '700',
  },
});
