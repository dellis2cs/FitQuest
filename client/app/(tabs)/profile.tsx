import React, { useState, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Pressable,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../context/authContext';
import EditProfileModal from '../components/EditProfileModal';

// Updated Stat interface matches backend response
interface Stat {
  title: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  xpToNextLevel: number;
  percentComplete: number;
  icon: string;
}

interface UserData {
  username: string;
  email: string;
  total_xp: number;
  current_level: number;
  stats: Stat[];
  bench_1rm: number;
  squat_1rm: number;
  deadlift_1rm: number;
  avatar_url: string;
}

const StatCard: React.FC<{ stat: Stat }> = ({ stat }) => {
  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={styles.statIconContainer}>
          <Text style={styles.statIcon}>{stat.icon}</Text>
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statTitle}>{stat.title}</Text>
          <Text style={styles.statLevel}>Level {stat.level}</Text>
        </View>
        <View style={styles.statXpContainer}>
          <Text style={styles.statXpValue}>{Math.floor(stat.currentXp)}</Text>
          <Text style={styles.statXpMax}>/{Math.floor(stat.nextLevelXp)} XP</Text>
        </View>
      </View>
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressFill,
            { width: `${stat.percentComplete}%` }
          ]}
        />
      </View>
      <Text style={styles.percentText}>{stat.percentComplete.toFixed(0)}% to next level</Text>
    </View>
  );
};

export default function ProfileScreen() {
  const { signOut, token } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const router = useRouter();

  const { data: userData, isLoading, error } = useQuery<UserData, Error>({
    queryKey: ['profile', token],
    queryFn: async () => {
      const res = await fetch('http://localhost:8000/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        await signOut();
        router.replace('/');
        throw new Error('unauthorized');
      }
      return res.json();
    },
    staleTime: 5 * 60_000,
    retry: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  if (error || !userData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile.</Text>
      </View>
    );
  }

  const {
    username,
    email,
    total_xp,
    current_level,
    stats,
    bench_1rm,
    squat_1rm,
    deadlift_1rm,
    avatar_url,
  } = userData;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Text style={styles.headerButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.headerButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.headerButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.profileContent}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: avatar_url }} style={styles.avatar} />
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{current_level}</Text>
                </View>
              </View>
              <Text style={styles.username}>{username}</Text>
              <Text style={styles.totalXp}>{total_xp.toLocaleString()} Total Experience</Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Progress Overview</Text>
          <Text style={styles.sectionSubtitle}>
            Track your development across different fitness categories
          </Text>
          {stats.map((stat) => (
            <StatCard key={stat.title} stat={stat} />
          ))}
        </View>

        {/* Personal Records */}
        <View style={styles.prSection}>
          <Text style={styles.sectionTitle}>Personal Records</Text>
          <Text style={styles.sectionSubtitle}>
            Your current one-rep maximum achievements
          </Text>
          <View style={styles.prCard}>
            <View style={styles.prGrid}>
              {[
                { label: 'Bench', value: bench_1rm },
                { label: 'Squat', value: squat_1rm },
                { label: 'Deadlift', value: deadlift_1rm },
              ].map((pr, index) => (
                <React.Fragment key={pr.label}>
                  <View style={styles.prItem}>
                    <Text style={styles.prLabel}>{pr.label}</Text>
                    <Text style={styles.prValue}>{pr.value}</Text>
                    <Text style={styles.prUnit}>lbs</Text>
                  </View>
                  {index < 2 && <View style={styles.prDivider} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Settings</Text>
            
            <Pressable
              style={styles.modalOption}
              onPress={() => {
                setModalVisible(false);
                setEditModalVisible(true);
              }}
            >
              <Text style={styles.modalOptionText}>Edit Profile</Text>
            </Pressable>
            
            <View style={styles.modalDivider} />
            
            <Pressable
              style={styles.modalOption}
              onPress={async () => {
                setModalVisible(false);
                queryClient.removeQueries(); 
                await signOut();
                router.replace('/');
              }}
            >
              <Text style={[styles.modalOptionText, styles.signOutOptionText]}>Sign Out</Text>
            </Pressable>
            
            <Pressable
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      {userData && (
        <EditProfileModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          currentData={{
            username: userData.username,
            email: userData.email,
            avatar_url: userData.avatar_url,
            bench_1rm: userData.bench_1rm,
            squat_1rm: userData.squat_1rm,
            deadlift_1rm: userData.deadlift_1rm,
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerButtonText: {
    fontSize: 20,
    color: '#1a1a1a',
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  profileSection: {
    paddingHorizontal: 32,
    marginBottom: 48,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  profileContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 28,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 36,
    height: 36,
    backgroundColor: '#1a1a1a',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  levelBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  username: {
    fontSize: 28,
    fontWeight: '400',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  totalXp: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '400',
  },
  statsSection: {
    paddingHorizontal: 32,
    marginBottom: 48,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '400',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 32,
    lineHeight: 24,
    fontWeight: '400',
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statIcon: {
    fontSize: 20,
  },
  statInfo: {
    flex: 1,
  },
  statTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  statLevel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '400',
  },
  statXpContainer: {
    alignItems: 'flex-end',
  },
  statXpValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -0.2,
  },
  statXpMax: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '400',
  },
  progressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#485c11',
    borderRadius: 3,
  },
  percentText: {
    fontSize: 12,
    color: '#64748b',
    alignSelf: 'flex-end',
    fontWeight: '400',
  },
  prSection: {
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  prCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  prGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  prItem: {
    alignItems: 'center',
    flex: 1,
  },
  prDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 20,
    height: 60,
  },
  prLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  prValue: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  prUnit: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '400',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 20,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '400',
  },
  signOutOptionText: {
    color: '#dc2626',
    fontWeight: '500',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  modalButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelText: {
    color: '#475569',
    fontWeight: '500',
    fontSize: 16,
  },
});