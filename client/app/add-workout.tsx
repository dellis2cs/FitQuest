"use client"
import React, { useContext, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AuthContext } from './context/authContext'
import { SafeAreaView } from 'react-native-safe-area-context'

// Optional: mirror your calcStatXP server logic if you want to compute XP client-side
function calcStatXP(
  reps: number | null,
  weight: number | null,
  oneRepMax = 1,
  K = 10
) {
  if (!reps || !weight) return 0
  const intensity = Math.min(weight / oneRepMax, 1)
  return reps * intensity * K
}

type MovementLine = {
  movement: string
  weight: string
  reps: string
  statCategory: 'Strength' | 'Speed' | 'Stamina' | 'Flexibility'
}

export default function AddWorkout() {
  const { token } = useContext(AuthContext)
  const router = useRouter()
  const queryClient = useQueryClient()

  // form state
  const [lines, setLines] = useState<MovementLine[]>([
    { movement: '', weight: '', reps: '', statCategory: 'Strength' },
  ])

  // mutation to create session + movements
  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        performed_at: new Date().toISOString(),
        movements: lines.map(l => {
          const w = l.weight ? parseFloat(l.weight) : null
          const r = l.reps ? parseInt(l.reps, 10) : null
          return {
            movement: l.movement,
            weight: w,
            reps: r,
            duration_seconds: l.statCategory === 'Stamina' ? r : null,
            stat_category: l.statCategory,
            xp_awarded: calcStatXP(r, w),
          }
        }),
      }

      const res = await fetch('http://localhost:8000/workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.message || `Error (${res.status})`)
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workouts'])
      queryClient.invalidateQueries(['profile'])
      router.back()
    },
    onError: (err: any) => {
      Alert.alert('Could not save workout', err.message)
    },
  })

  const handleSave = () => {
    for (const line of lines) {
      if (!line.movement.trim()) {
        return Alert.alert('Please enter a movement name')
      }
    }
    mutation.mutate()
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Workout</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Add Movements</Text>
          <Text style={styles.sectionSubtitle}>
            Record your exercises with weights, reps, or duration
          </Text>

          {lines.map((line, i) => (
            <View key={i} style={styles.movementCard}>
              <View style={styles.movementHeader}>
                <Text style={styles.movementNumber}>Movement {i + 1}</Text>
                {lines.length > 1 && (
                  <TouchableOpacity
                    onPress={() => setLines(lines.filter((_, idx) => idx !== i))}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Exercise Name</Text>
                <TextInput
                  placeholder="e.g., Bench Press, Squats"
                  style={styles.input}
                  value={line.movement}
                  placeholderTextColor="#94a3b8"
                  onChangeText={t => {
                    const copy = [...lines]
                    copy[i].movement = t
                    setLines(copy)
                  }}
                />
              </View>

              {line.statCategory === 'Stamina' ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Duration</Text>
                  <TextInput
                    placeholder="Duration in seconds"
                    style={styles.input}
                    keyboardType="numeric"
                    value={line.reps}
                    placeholderTextColor="#94a3b8"
                    onChangeText={t => {
                      const copy = [...lines]
                      copy[i].reps = t
                      setLines(copy)
                    }}
                  />
                </View>
              ) : (
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, styles.inputHalf]}>
                    <Text style={styles.inputLabel}>Weight</Text>
                    <TextInput
                      placeholder="lbs"
                      style={styles.input}
                      keyboardType="numeric"
                      value={line.weight}
                      placeholderTextColor="#94a3b8"
                      onChangeText={t => {
                        const copy = [...lines]
                        copy[i].weight = t
                        setLines(copy)
                      }}
                    />
                  </View>
                  <View style={[styles.inputGroup, styles.inputHalf]}>
                    <Text style={styles.inputLabel}>Reps</Text>
                    <TextInput
                      placeholder="reps"
                      style={styles.input}
                      keyboardType="numeric"
                      value={line.reps}
                      placeholderTextColor="#94a3b8"
                      onChangeText={t => {
                        const copy = [...lines]
                        copy[i].reps = t
                        setLines(copy)
                      }}
                    />
                  </View>
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity
            onPress={() =>
              setLines([
                ...lines,
                { movement: '', weight: '', reps: '', statCategory: 'Strength' },
              ])
            }
            style={styles.addBtn}
          >
            <Text style={styles.addText}>+ Add Another Movement</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={mutation.isLoading}
            style={[
              styles.saveBtn,
              mutation.isLoading && styles.saveBtnDisabled,
            ]}
          >
            <Text style={styles.saveText}>
              {mutation.isLoading ? 'Saving Workout...' : 'Save Workout'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
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
  scrollContent: {
    paddingBottom: 40,
  },
  formSection: {
    paddingHorizontal: 32,
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
    marginBottom: 32,
    lineHeight: 24,
    fontWeight: '400',
  },
  movementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
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
    alignItems: 'center',
    marginBottom: 20,
  },
  movementNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  removeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  removeText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
    fontWeight: '400',
  },
  addBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  addText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  actionSection: {
    paddingHorizontal: 32,
  },
  saveBtn: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
})