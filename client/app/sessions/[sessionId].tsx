"use client"
import React, { useContext } from 'react'
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { AuthContext } from '../context/authContext'
import { apiFetch } from '../lib/api'

// match your backend's getSessionDetail response
interface Movement {
  id: string
  movement: string
  weight: number | null
  reps: number | null
  sets: number | null
  duration_seconds: number | null
  stat_category: string
  xp_awarded: number
  performed_at: string
}

const MovementCard: React.FC<{ movement: Movement }> = ({ movement }) => {
  const isDuration = movement.stat_category === 'Stamina' && movement.duration_seconds != null

  return (
    <View style={styles.movementCard}>
      <View style={styles.movementHeader}>
        <View style={styles.movementInfo}>
          <Text style={styles.movementName}>{movement.movement}</Text>
          <View style={styles.statBadge}>
            <Text style={styles.statBadgeText}>{movement.stat_category}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.movementStats}>
        {isDuration ? (
          <View style={styles.movementStat}>
            <Text style={styles.movementStatLabel}>Duration</Text>
            <Text style={styles.movementStatValue}>{movement.duration_seconds} sec</Text>
          </View>
        ) : (
          <>
            <View style={styles.movementStat}>
              <Text style={styles.movementStatLabel}>Weight</Text>
              <Text style={styles.movementStatValue}>{movement.weight} lbs</Text>
            </View>
            <View style={styles.movementStatDivider} />
            <View style={styles.movementStat}>
              <Text style={styles.movementStatLabel}>Reps</Text>
              <Text style={styles.movementStatValue}>{movement.reps}</Text>
            </View>
            <View style={styles.movementStat}>
              <Text style={styles.movementStatLabel}>Sets</Text>
              <Text style={styles.movementStatValue}>{movement.sets}</Text>
            </View>
          </>
        )}
        <View style={styles.movementStatDivider} />
        <View style={styles.movementStat}>
          <Text style={styles.movementStatLabel}>XP</Text>
          <Text style={styles.movementStatXp}>+{Math.floor(movement.xp_awarded)}</Text>
        </View>
      </View>
    </View>
  )
}

export default function SessionDetailScreen() {
  const { token, signOut } = useContext(AuthContext)
  const router = useRouter()
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()

  const { data, isLoading, error, refetch } = useQuery<Movement[], Error>({
    queryKey: ['sessionDetail', sessionId],
    queryFn: async () => {
      const res = await apiFetch(`/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        await signOut()
        router.replace('/')
        throw new Error('unauthorized')
      }
      if (!res.ok) {
        throw new Error('Failed to fetch session details')
      }
      return res.json()
    },
    enabled: !!sessionId,
  })

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error.message}</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const totalXP = data?.reduce((sum, movement) => sum + movement.xp_awarded, 0) || 0

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Session Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Session Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Workout Summary</Text>
          <Text style={styles.sectionSubtitle}>
            {data?.length || 0} movement(s) • {Math.floor(totalXP)} total XP earned
          </Text>
        </View>

        {/* Movements List */}
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <MovementCard movement={item} />}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 32,
  },
  backBtn: {
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
  backText: {
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
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  summarySection: {
    marginBottom: 32,
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
    lineHeight: 24,
    fontWeight: '400',
  },
  listContent: {
    paddingBottom: 40,
  },
  movementCard: {
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
  movementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  movementInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  movementName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1a1a1a',
    letterSpacing: -0.2,
    flex: 1,
  },
  statBadge: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  statBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#ffffff',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  movementStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  movementStat: {
    alignItems: 'center',
    flex: 1,
  },
  movementStatDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
    height: 32,
  },
  movementStatLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  movementStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -0.2,
  },
  movementStatXp: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    letterSpacing: -0.2,
  },
})