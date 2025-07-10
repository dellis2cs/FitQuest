import React, { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../context/authContext';

// match whatever your backend returns
export interface Session {
  id: string;
  performed_at: string;
  movement_count: number;
  total_xp: number;
}

const SessionCard: React.FC<{ session: Session }> = ({ session }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  return (
    <View style={styles.SessionCard}>
      <View style={styles.workoutHeader}>
        <View style={styles.workoutInfo}>
          <Text style={styles.workoutMovement}>{formatDate(session.performed_at)}</Text>

        </View>
      </View>
      
      <View style={styles.workoutStats}>
        
          <>
            <View style={styles.workoutStat}>
              <Text style={styles.workoutStatLabel}>Movments</Text>
              <Text style={styles.workoutStatValue}>{session.movement_count}</Text>
            </View>
            <View style={styles.workoutStatDivider} />
            
          </>

        <View style={styles.workoutStat}>
          <Text style={styles.workoutStatLabel}>XP</Text>
          <Text style={styles.workoutStatXp}>+{Math.floor(session.total_xp)}</Text>
        </View>
      </View>
    </View>
  );
};

export default function WorkoutScreen() {
  const { token, signOut } = useContext(AuthContext);
  const router = useRouter();

  const {
    data: workouts,
    isLoading,
    error,
    refetch,
  } = useQuery<Session[], Error>({
    queryKey: ['workouts'],
    queryFn: async () => {
      const res = await fetch('http://localhost:8000/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        await signOut();
        router.replace('/');
        throw new Error('unauthorized');
      }
      if (!res.ok) {
        throw new Error('Failed to fetch workouts');
      }
      return res.json();
    },
    staleTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  if (error || !workouts) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error?.message || 'Error loading workouts'}
        </Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Workouts</Text>
          <TouchableOpacity onPress={() => router.push('add-workout')} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>＋</Text>
          </TouchableOpacity>
        </View>

        {/* Workouts List */}
        <View style={styles.workoutsSection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Text style={styles.sectionSubtitle}>
            Track your progress with detailed workout insights
          </Text>
          
          <FlatList
            data={workouts}
            keyExtractor={(item) => item.id}
            renderItem={({ item: session }) => (
  <TouchableOpacity
    onPress={() => router.push(`/sessions/${session.id}`)}
  >
    <SessionCard session={session} />
  </TouchableOpacity>
)}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
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
  workoutsSection: {
    paddingHorizontal: 32,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 40,
    lineHeight: 24,
    fontWeight: '400',
  },
  SessionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 28,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutMovement: {
    fontSize: 20,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  workoutDate: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '400',
  },
  statBadge: {
    backgroundColor:'#485c11',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutStat: {
    alignItems: 'center',
    flex: 1,
  },
  workoutStatDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 20,
    height: 40,
  },
  workoutStatLabel: {
    fontSize: 12,
    color: '#1a1a1a',
    marginBottom: 6,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workoutStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -0.2,
  },
  workoutStatXp: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -0.2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '400',
  },
  retryButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});