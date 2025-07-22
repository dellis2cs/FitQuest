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

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  currentData: {
    username: string;
    email: string;
    avatar_url: string;
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
      const res = await fetch('http://localhost:8000/profile/update', {
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

      // If avatar changed, upload it separately
      if (avatarUri) {
        const formData = new FormData();
        
        // In React Native, we need to construct the file object properly
        formData.append('avatar', {
          uri: avatarUri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any);

        const avatarRes = await fetch('http://localhost:8000/profile/avatar', {
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
    marginBottom: 20,
    letterSpacing: -0.3,
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