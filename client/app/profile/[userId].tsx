import React, { useState, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AuthContext } from '../context/authContext';
import { apiFetch } from '../lib/api';

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
  id: string;
  username: string;
  total_xp: number;
  current_level: number;
  stats: Stat[];
  bench_1rm?: number;
  squat_1rm?: number;
  deadlift_1rm?: number;
  avatar_url: string;
  email?: string;
  isFriend: boolean;
  isOwnProfile: boolean;
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

export default function UserProfileScreen() {
  const { token } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const { data: userData, isLoading, error } = useQuery<UserData, Error>({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      const res = await apiFetch(`/profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch profile');
      }
      return res.json();
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  // Friend request mutation
  const sendFriendRequest = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiFetch(`/friend-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipient_username: username }),
      });
      if (!res.ok) throw new Error('Request failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile', userId]);
      queryClient.invalidateQueries(['friends']);
    },
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {
    username,
    total_xp,
    current_level,
    stats,
    bench_1rm,
    squat_1rm,
    deadlift_1rm,
    avatar_url,
    isFriend,
    isOwnProfile,
  } = userData;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Text style={styles.headerButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isOwnProfile ? 'My Profile' : 'Profile'}</Text>
          <View style={styles.headerButton} />
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
              
              {/* Friend Action Button */}
              {!isOwnProfile && !isFriend && (
                <TouchableOpacity
                  style={styles.friendRequestButton}
                  onPress={() => sendFriendRequest.mutate(username)}
                  disabled={sendFriendRequest.isLoading}
                >
                  <Text style={styles.friendRequestButtonText}>
                    {sendFriendRequest.isLoading ? 'Sending...' : 'Add Friend'}
                  </Text>
                </TouchableOpacity>
              )}
              
              {!isOwnProfile && isFriend && (
                <View style={styles.friendBadge}>
                  <Text style={styles.friendBadgeText}>Friends</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Progress Overview</Text>
          <Text style={styles.sectionSubtitle}>
            {isOwnProfile ? 'Track your development across different fitness categories' : `${username}'s progress in different fitness categories`}
          </Text>
          {stats.map((stat) => (
            <StatCard key={stat.title} stat={stat} />
          ))}
        </View>

        {/* Personal Records - Only show if own profile or friends */}
        {(isOwnProfile || isFriend) && bench_1rm !== undefined && (
          <View style={styles.prSection}>
            <Text style={styles.sectionTitle}>Personal Records</Text>
            <Text style={styles.sectionSubtitle}>
              {isOwnProfile ? 'Your current one-rep maximum achievements' : `${username}'s one-rep maximum achievements`}
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
        )}

        {/* Privacy Notice for non-friends */}
        {!isOwnProfile && !isFriend && (
          <View style={styles.privacyNotice}>
            <Text style={styles.privacyNoticeText}>
              Personal records are only visible to friends
            </Text>
          </View>
        )}
      </ScrollView>
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
    marginBottom: 20,
  },
  friendRequestButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  friendRequestButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  friendBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginTop: 8,
  },
  friendBadgeText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '500',
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
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  privacyNotice: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    marginHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  privacyNoticeText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '400',
  },
});