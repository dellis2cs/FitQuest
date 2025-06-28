import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
} from 'react-native';

interface Workout {
  id: string;
  movement: string;
  weight: number;
  reps: number;
  statCategory: string;
  xpAwarded: number;
  performedAt: string;
}

interface QuickStatProps {
  title: string;
  value: string;
  icon: string;
}

const QuickStat: React.FC<QuickStatProps> = ({ title, value, icon }) => (
  <View style={styles.quickStatCard}>
    <View style={styles.quickStatContent}>
      <View style={styles.quickStatIconContainer}>
        <Text style={styles.quickStatIcon}>{icon}</Text>
      </View>
      <Text style={styles.quickStatValue}>{value}</Text>
      <Text style={styles.quickStatTitle}>{title}</Text>
    </View>
  </View>
);

const WorkoutCard: React.FC<{ workout: Workout }> = ({ workout }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.workoutCard}>
      <View style={styles.workoutHeader}>
        <View style={styles.workoutInfo}>
          <Text style={styles.workoutMovement}>{workout.movement}</Text>
          <Text style={styles.workoutDate}>{formatDate(workout.performedAt)}</Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={styles.statBadgeText}>{workout.statCategory}</Text>
        </View>
      </View>
      
      <View style={styles.workoutStats}>
        <View style={styles.workoutStat}>
          <Text style={styles.workoutStatLabel}>Weight</Text>
          <Text style={styles.workoutStatValue}>{workout.weight} lbs</Text>
        </View>
        <View style={styles.workoutStatDivider} />
        <View style={styles.workoutStat}>
          <Text style={styles.workoutStatLabel}>Reps</Text>
          <Text style={styles.workoutStatValue}>{workout.reps}</Text>
        </View>
        <View style={styles.workoutStatDivider} />
        <View style={styles.workoutStat}>
          <Text style={styles.workoutStatLabel}>XP Gained</Text>
          <Text style={styles.workoutStatXp}>+{Math.floor(workout.xpAwarded)}</Text>
        </View>
      </View>
    </View>
  );
};

const WorkoutScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('recent');

  // Mock data - replace with actual workout data
  const recentWorkouts: Workout[] = [
    {
      id: '1',
      movement: 'Bench Press',
      weight: 185,
      reps: 8,
      statCategory: 'Strength',
      xpAwarded: 45.2,
      performedAt: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      movement: 'Squats',
      weight: 225,
      reps: 10,
      statCategory: 'Strength',
      xpAwarded: 52.8,
      performedAt: '2024-01-15T10:15:00Z',
    },
    {
      id: '3',
      movement: 'Running',
      weight: 0,
      reps: 30, // minutes
      statCategory: 'Stamina',
      xpAwarded: 38.5,
      performedAt: '2024-01-14T07:00:00Z',
    },
    {
      id: '4',
      movement: 'Yoga Flow',
      weight: 0,
      reps: 45, // minutes
      statCategory: 'Flexibility',
      xpAwarded: 28.3,
      performedAt: '2024-01-13T18:30:00Z',
    },
  ];

  const todayStats = {
    workouts: 3,
    totalXp: 136,
    duration: '1h 15m',
  };

  const handleAddWorkout = () => {
    // Navigate to add workout screen
    console.log('Navigate to add workout');
  };

  const renderTab = (tabKey: string, label: string) => (
    <TouchableOpacity
      key={tabKey}
      style={[styles.tab, activeTab === tabKey && styles.activeTab]}
      onPress={() => setActiveTab(tabKey)}
    >
      <Text style={[styles.tabText, activeTab === tabKey && styles.activeTabText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton}>
            <Text style={styles.headerButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Workouts</Text>
          <TouchableOpacity style={styles.headerButton}>
            <Text style={styles.headerButtonText}>☰</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Today's Progress</Text>
          <View style={styles.quickStatsGrid}>
            <QuickStat
              title="Workouts"
              value={todayStats.workouts.toString()}
              icon="🏋️"
            />
            <QuickStat
              title="Total XP"
              value={todayStats.totalXp.toString()}
              icon="⭐"
            />
            <QuickStat
              title="Duration"
              value={todayStats.duration}
              icon="⏱️"
            />
          </View>
        </View>

        {/* Add Workout Button */}
        <View style={styles.addWorkoutSection}>
          <TouchableOpacity 
            style={styles.addWorkoutButton}
            onPress={handleAddWorkout}
          >
            <View style={styles.addWorkoutContent}>
              <View style={styles.addWorkoutIconContainer}>
                <Text style={styles.addWorkoutIcon}>+</Text>
              </View>
              <Text style={styles.addWorkoutText}>Add New Workout</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Workout History */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <View style={styles.tabRow}>
              {renderTab('recent', 'Recent')}
              {renderTab('favorites', 'Favorites')}
              {renderTab('personal', 'PRs')}
            </View>
          </View>

          {/* Workout List */}
          <FlatList
            data={recentWorkouts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <WorkoutCard workout={item} />}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerButtonText: {
    fontSize: 18,
    color: '#000000',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  summarySection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 24,
  },
  quickStatsGrid: {
    flexDirection: 'row',
  },
  quickStatCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f9fafb',
  },
  quickStatContent: {
    alignItems: 'center',
  },
  quickStatIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickStatIcon: {
    fontSize: 18,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  quickStatTitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  addWorkoutSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  addWorkoutButton: {
    backgroundColor: '#288afa',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  addWorkoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addWorkoutIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addWorkoutIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addWorkoutText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  historySection: {
    paddingHorizontal: 24,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#288afa',
  },
  tabContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f9fafb',
  },
  tabRow: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#288afa',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  workoutCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f9fafb',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutMovement: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  statBadge: {
    backgroundColor: '#288afa',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
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
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
    height: 32,
  },
  workoutStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  workoutStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  workoutStatXp: {
    fontSize: 16,
    fontWeight: '600',
    color: '#288afa',
  },
});

export default WorkoutScreen;