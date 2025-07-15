"use client";
import React, { useState, useContext } from "react";
import {
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet,
  SafeAreaView,
  ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../context/authContext";

export default function OneRepMaxes() {
  const { token } = useContext(AuthContext);
  const [bench, setBench] = useState("");
  const [squat, setSquat] = useState("");
  const [deadlift, setDeadlift] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!bench || !squat || !deadlift) {
      return Alert.alert("Missing Information", "Please fill in all three maxes");
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/maxes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bench_1rm: parseFloat(bench),
          squat_1rm: parseFloat(squat),
          deadlift_1rm: parseFloat(deadlift),
        }),
      });

      if (!res.ok) throw new Error((await res.json()).message);

      // on success, send them into the app
      router.replace("/workouts");
    } catch (err: any) {
      Alert.alert("Error saving maxes", err.message);
    } finally {
      setLoading(false);
    }
  };

  const exercises = [
    { 
      label: "Bench Press", 
      value: bench, 
      setter: setBench,
      description: "Your maximum single repetition for bench press"
    },
    { 
      label: "Squat", 
      value: squat, 
      setter: setSquat,
      description: "Your maximum single repetition for squat"
    },
    { 
      label: "Deadlift", 
      value: deadlift, 
      setter: setDeadlift,
      description: "Your maximum single repetition for deadlift"
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Set Your Baseline</Text>
            <Text style={styles.subtitle}>
              Enter your current one-rep maximums to personalize your workout experience and track your progress effectively.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {exercises.map(({ label, value, setter, description }) => (
              <View key={label} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{label}</Text>
                <Text style={styles.inputDescription}>{description}</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="Enter weight"
                    placeholderTextColor="#94a3b8"
                    value={value}
                    onChangeText={setter}
                  />
                  <Text style={styles.inputUnit}>lbs</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Action */}
          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Saving..." : "Save & Continue"}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.helpText}>
              Don't know your one-rep max? You can estimate it or update these values later in your profile.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "300",
    color: "#1a1a1a",
    marginBottom: 16,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "400",
    paddingHorizontal: 8,
  },
  form: {
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: "500",
    color: "#1a1a1a",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  inputDescription: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 12,
    lineHeight: 20,
    fontWeight: "400",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: "#1a1a1a",
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  inputUnit: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
    marginLeft: 12,
  },
  actionSection: {
    alignItems: "center",
  },
  button: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 200,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: -0.1,
  },
  helpText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "400",
    paddingHorizontal: 16,
  },
});