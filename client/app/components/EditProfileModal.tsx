import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/authContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  currentData: {
    username: string;
    email: string;
    avatar_url: string;
    bench_1rm?: number;
    squat_1rm?: number;
    deadlift_1rm?: number;
  };
}

export default function EditProfileModal({ visible, onClose, currentData }: EditProfileModalProps) {
  const { token } = useContext(AuthContext);
  const queryClient = useQueryClient();
  
  const [username, setUsername] = useState(currentData.username);
  const [email, setEmail] = useState(currentData.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  
  // 1RM fields
  const [bench1RM, setBench1RM] = useState(currentData.bench_1rm?.toString() || '');
  const [squat1RM, setSquat1RM] = useState(currentData.squat_1rm?.toString() || '');
  const [deadlift1RM, setDeadlift1RM] = useState(currentData.deadlift_1rm?.toString() || '');

  // Image picker
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  // Update 1RM mutation
  const update1RMMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/maxes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bench_1rm: parseFloat(bench1RM) || 0,
          squat_1rm: parseFloat(squat1RM) || 0,
          deadlift_1rm: parseFloat(deadlift1RM) || 0,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update 1RM values');
      }

      return res.json();
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      // First update text fields
      const profileData: any = {
        username,
        email,
      };

      // Add password fields if changing password
      if (showPasswordFields && newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (newPassword.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        profileData.currentPassword = currentPassword;
        profileData.newPassword = newPassword;
      }

      // Update profile data
      const res = await apiFetch('/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update profile');
      }

      // Update 1RM values if they've changed
      const bench1RMChanged = parseFloat(bench1RM) !== currentData.bench_1rm;
      const squat1RMChanged = parseFloat(squat1RM) !== currentData.squat_1rm;
      const deadlift1RMChanged = parseFloat(deadlift1RM) !== currentData.deadlift_1rm;

      if (bench1RMChanged || squat1RMChanged || deadlift1RMChanged) {
        await update1RMMutation.mutateAsync();
      }

      // If avatar changed, upload it separately
      if (avatarUri) {
        const formData = new FormData();
        
        // In React Native, we need to construct the file object properly
        formData.append('avatar', {
          uri: avatarUri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any);

        const avatarRes = await apiFetch('/profile/avatar', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type for FormData
          },
          body: formData,
        });

        if (!avatarRes.ok) {
          console.error('Avatar upload failed but profile updated');
        }
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      Alert.alert('Success', 'Profile updated successfully');
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleSave = () => {
    if (!username.trim() || !email.trim()) {
      Alert.alert('Error', 'Username and email are required');
      return;
    }

    // Validate 1RM values if provided
    if (bench1RM && isNaN(parseFloat(bench1RM))) {
      Alert.alert('Error', 'Bench 1RM must be a valid number');
      return;
    }
    if (squat1RM && isNaN(parseFloat(squat1RM))) {
      Alert.alert('Error', 'Squat 1RM must be a valid number');
      return;
    }
    if (deadlift1RM && isNaN(parseFloat(deadlift1RM))) {
      Alert.alert('Error', 'Deadlift 1RM must be a valid number');
      return;
    }

    updateProfileMutation.mutate();
  };

  const resetForm = () => {
    setUsername(currentData.username);
    setEmail(currentData.email);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setAvatarUri(null);
    setShowPasswordFields(false);
    setBench1RM(currentData.bench_1rm?.toString() || '');
    setSquat1RM(currentData.squat_1rm?.toString() || '');
    setDeadlift1RM(currentData.deadlift_1rm?.toString() || '');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { resetForm(); onClose(); }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity 
            onPress={handleSave}
            disabled={updateProfileMutation.isLoading}
          >
            {updateProfileMutation.isLoading ? (
              <ActivityIndicator size="small" color="#1a1a1a" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage}>
              <Image 
                source={{ uri: avatarUri || currentData.avatar_url }} 
                style={styles.avatar} 
              />
              <View style={styles.changeAvatarButton}>
                <Text style={styles.changeAvatarText}>Change Photo</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* One Rep Maxes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>One Rep Maxes</Text>
            <Text style={styles.sectionDescription}>
              Update your personal records to track progress accurately
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bench Press (lbs)</Text>
              <TextInput
                style={styles.input}
                value={bench1RM}
                onChangeText={setBench1RM}
                placeholder="Enter bench press 1RM"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Squat (lbs)</Text>
              <TextInput
                style={styles.input}
                value={squat1RM}
                onChangeText={setSquat1RM}
                placeholder="Enter squat 1RM"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Deadlift (lbs)</Text>
              <TextInput
                style={styles.input}
                value={deadlift1RM}
                onChangeText={setDeadlift1RM}
                placeholder="Enter deadlift 1RM"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Password Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordFields(!showPasswordFields)}>
                <Text style={styles.changePasswordLink}>
                  {showPasswordFields ? 'Cancel' : 'Change Password'}
                </Text>
              </TouchableOpacity>
            </View>

            {showPasswordFields && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Current Password</Text>
                  <TextInput
                    style={styles.input}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm New Password</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry
                  />
                </View>
              </>
            )}
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
  saveText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 16,
    right: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 6,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  changeAvatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 20,
    fontWeight: '400',
  },
  changePasswordLink: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
});