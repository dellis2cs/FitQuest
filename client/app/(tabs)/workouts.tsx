import React, { useContext, useState } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../context/authContext';
import { apiFetch } from '../lib/api';
import WorkoutCalendar from '../components/WorkoutCalender';

// match whatever your backend returns
export interface Session {
  id: string;
  performed_at: string;
  movement_count: number;
  total_xp: number;
}

interface StreakData {
  currentMonth: number;
  currentYear: number;
  workoutDates: string[];
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  daysInMonth: number;
}

interface PaginatedResponse {
  sessions: Session[];
  total: number;
  hasMore: boolean;
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
        <View style={styles.workoutStat}>
          <Text style={styles.workoutStatLabel}>Movements</Text>
          <Text style={styles.workoutStatValue}>{session.movement_count}</Text>
        </View>
        <View style={styles.workoutStatDivider} />
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
  const [refreshing, setRefreshing] = useState(false);

  // Fetch workout streak data
  const { 
    data: streakData, 
    isLoading: streakLoading,
    refetch: refetchStreak 
  } = useQuery<StreakData>({
    queryKey: ['workoutStreak'],
    queryFn: async () => {
      const res = await apiFetch('/workout-streak', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch streak data');
      return res.json();
    },
  });

  // Use infinite query for paginated sessions
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: sessionsLoading,
    refetch: refetchSessions,
  } = useInfiniteQuery<PaginatedResponse>({
    queryKey: ['workoutSessions'],
    queryFn: async ({ pageParam }) => {
      const res = await apiFetch(
        `/sessions/paginated?offset=${pageParam}&limit=15`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 401) {
        await signOut();
        router.replace('/');
        throw new Error('unauthorized');
      }
      if (!res.ok) throw new Error('Failed to fetch sessions');
      return res.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loadedCount = pages.reduce((sum, page) => sum + page.sessions.length, 0);
      return lastPage.hasMore ? loadedCount : undefined;
    },
    staleTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const sessions = data?.pages.flatMap(page => page.sessions) || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStreak(), refetchSessions()]);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (sessionsLoading || streakLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  const renderFooter = () => {
    if (!hasNextPage) return null;
    
    return (
      <View style={styles.footerLoader}>
        {isFetchingNextPage ? (
          <ActivityIndicator size="small" color="#1a1a1a" />
        ) : (
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={handleLoadMore}
          >
            <Text style={styles.loadMoreText}>Load More</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderSessionItem = ({ item }: { item: Session }) => (
    <TouchableOpacity
      onPress={() => router.push(`/sessions/${item.id}`)}
    >
      <SessionCard session={item} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={renderSessionItem}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                <Text style={styles.headerButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Dashboard</Text>
              <TouchableOpacity onPress={() => router.push('add-workout')} style={styles.headerButton}>
                <Text style={styles.headerButtonText}>＋</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dashboardContent}>
              {/* Streak Stats */}
              {streakData && (
                <View style={styles.streakSection}>
                  <View style={styles.streakCards}>
                    <View style={styles.streakCard}>
                      <Text style={styles.streakNumber}>{streakData.currentStreak}</Text>
                      <Text style={styles.streakLabel}>Current Streak</Text>
                    </View>
                    <View style={styles.streakCard}>
                      <Text style={styles.streakNumber}>{streakData.totalWorkouts}</Text>
                      <Text style={styles.streakLabel}>This Month</Text>
                    </View>
                    <View style={styles.streakCard}>
                      <Text style={styles.streakNumber}>{streakData.longestStreak}</Text>
                      <Text style={styles.streakLabel}>Best Streak</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Calendar */}
              {streakData && (
                <WorkoutCalendar
                  workoutDates={streakData.workoutDates}
                  currentMonth={streakData.currentMonth}
                  currentYear={streakData.currentYear}
                  daysInMonth={streakData.daysInMonth}
                />
              )}

              {/* Recent Sessions Header */}
              <View style={styles.sessionsSection}>
                <Text style={styles.sectionTitle}>Recent Sessions</Text>
                <Text style={styles.sectionSubtitle}>
                  Track your progress with detailed workout insights
                </Text>
              </View>
            </View>
          </>
        }
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  listContent: {
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
  dashboardContent: {
    paddingHorizontal: 32,
  },
  streakSection: {
    marginBottom: 24,
  },
  streakCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  streakCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sessionsSection: {
    marginTop: 8,
    marginBottom: 24,
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
    color: '#6b7280',
    lineHeight: 24,
    fontWeight: '400',
  },
  SessionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 28,
    marginBottom: 20,
    marginHorizontal: 32,
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadMoreButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
});