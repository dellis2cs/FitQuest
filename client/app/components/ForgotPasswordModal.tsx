import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../lib/api';

type ForgotPasswordModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function ForgotPasswordModal({ visible, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleRequestReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    try {
      setSending(true);
      const res = await apiFetch('/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      Alert.alert('Check your email', 'If an account exists, a reset link has been sent. In dev, check server logs for the token.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSending(false);
    }
  };

  const handleResetPassword = async () => {
    if (!token.trim() || !newPassword) {
      Alert.alert('Error', 'Please provide token and new password');
      return;
    }
    try {
      setResetting(true);
      const res = await apiFetch('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed');
      Alert.alert('Success', 'Password reset. You can now sign in.');
      setEmail('');
      setToken('');
      setNewPassword('');
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reset Password</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {/* Send reset link section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Send reset link</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your account email"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleRequestReset} disabled={sending}>
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Send reset link</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.hint}>Dev only: token is logged on the server</Text>
          </View>

          {/* Complete reset section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Use token to set new password</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reset token</Text>
              <View style={styles.inputRow}>
                <Ionicons name="key-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Paste token"
                  placeholderTextColor="#94a3b8"
                  value={token}
                  onChangeText={setToken}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New password</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter a new password"
                  placeholderTextColor="#94a3b8"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleResetPassword} disabled={resetting}>
              {resetting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Set new password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cancelText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1a1a1a',
    letterSpacing: -0.2,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#1a1a1a',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  primaryButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  hint: {
    marginTop: 10,
    fontSize: 12,
    color: '#6b7280',
  },
});


