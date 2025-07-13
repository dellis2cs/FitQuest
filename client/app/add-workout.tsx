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



type MovementLine = {
  movement: string
  weight: string
  reps: string         // for weights: reps, for cardio: duration
  type: 'Weights' | 'Stamina' | ''
}

export default function AddWorkout() {
  const { token } = useContext(AuthContext)
  const router = useRouter()
  const queryClient = useQueryClient()

  // one or more movement lines
  const [lines, setLines] = useState<MovementLine[]>([
    { movement: '', weight: '', reps: '', type: '' },
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
            weight: l.type === 'Weights' ? w : null,
            reps: l.type === 'Weights' ? r : null,
            duration_seconds: l.type === 'Stamina' ? r : null,
            stat_category: l.type === 'Weights' ? 'Strength' : 'Stamina',
            
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
    // validate each line
    for (const [i, line] of lines.entries()) {
      if (!line.type) {
        return Alert.alert(`Select type for movement ${i + 1}`)
      }
      if (!line.movement.trim()) {
        return Alert.alert(`Enter name for movement ${i + 1}`)
      }
    }
    mutation.mutate()
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Workout</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formSection}>
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

              {/* Per-line toggle */}
              <View style={styles.toggleGroup}>
                {(['Weights','Stamina'] as const).map(t => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => {
                      const copy = [...lines]
                      copy[i].type = t
                      setLines(copy)
                    }}
                    style={[
                      styles.toggleBtn,
                      line.type === t && styles.toggleBtnActive
                    ]}
                  >
                    <Text style={[
                      styles.toggleText,
                      line.type === t && styles.toggleTextActive
                    ]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                placeholder="Movement name"
                style={styles.input}
                value={line.movement}
                onChangeText={t => {
                  const copy = [...lines]
                  copy[i].movement = t
                  setLines(copy)
                }}
              />

              {line.type === 'Stamina' ? (
                <>
                  <Text style={styles.inputLabel}>Duration (sec)</Text>
                  <TextInput
                    placeholder="e.g. 60"
                    style={styles.input}
                    keyboardType="numeric"
                    value={line.reps}
                    onChangeText={t => {
                      const copy = [...lines]
                      copy[i].reps = t
                      setLines(copy)
                    }}
                  />
                </>
              ) : (
                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Weight (lbs)</Text>
                    <TextInput
                      placeholder="e.g. 135"
                      style={styles.input}
                      keyboardType="numeric"
                      value={line.weight}
                      onChangeText={t => {
                        const copy = [...lines]
                        copy[i].weight = t
                        setLines(copy)
                      }}
                    />
                  </View>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Reps</Text>
                    <TextInput
                      placeholder="e.g. 8"
                      style={styles.input}
                      keyboardType="numeric"
                      value={line.reps}
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
            onPress={() => setLines([...lines, { movement: '', weight: '', reps: '', type: '' }])}
            style={styles.addBtn}
          >
            <Text style={styles.addText}>+ Add Movement</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            disabled={mutation.isLoading}
            style={[styles.saveBtn, mutation.isLoading && styles.saveBtnDisabled]}
          >
            <Text style={styles.saveText}>
              {mutation.isLoading ? 'Saving…' : 'Save Workout'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 3 },
  backText: { fontSize: 20 },
  headerTitle: { fontSize: 24, fontWeight: '500' },
  headerSpacer: { width: 44 },
  scrollContent: { padding: 24 },
  formSection: {},
  toggleGroup: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  toggleBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#e2e8f0', marginHorizontal: 4, borderRadius: 8, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#1a1a1a', borderColor: '#1a1a1a' },
  toggleText: { color: '#64748b' },
  toggleTextActive: { color: '#fff' },
  movementCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, elevation: 2 },
  movementHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  movementNumber: { fontSize: 14, fontWeight: '500' },
  removeBtn: {},
  removeText: { color: '#dc2626' },
  inputLabel: { fontSize: 14, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, marginBottom: 12 },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between' },
  inputHalf: { flex: 1 },
  addBtn: { padding: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: '#e2e8f0', borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  addText: { color: '#64748b' },
  saveBtn: { backgroundColor: '#1a1a1a', padding: 16, borderRadius: 8, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontWeight: '500' },
})
