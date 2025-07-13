"use client";
import React, { useState, useContext } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Alert, StyleSheet
} from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../context/authContext";

export default function OneRepMaxes() {
  const { token } = useContext(AuthContext);
  const [bench, setBench] = useState("");
  const [squat, setSquat] = useState("");
  const [deadlift, setDeadlift] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    if (!bench || !squat || !deadlift) {
      return Alert.alert("Please fill in all three maxes");
    }
    try {
      const res = await fetch("http://localhost:8000/maxes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bench_1rm:  parseFloat(bench),
          squat_1rm:  parseFloat(squat),
          deadlift_1rm: parseFloat(deadlift),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      // on success, send them into the app
      router.replace("/workouts");
    } catch (err: any) {
      Alert.alert("Error saving maxes", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Set Your One-Rep Maxes</Text>
      {[
        { label: "Bench", value: bench, setter: setBench },
        { label: "Squat", value: squat, setter: setSquat },
        { label: "Deadlift", value: deadlift, setter: setDeadlift },
      ].map(({ label, value, setter }) => (
        <View key={label} style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="lbs"
            value={value}
            onChangeText={setter}
          />
        </View>
      ))}
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Save & Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, padding: 24, justifyContent: "center" },
  heading:    { fontSize: 24, marginBottom: 32, textAlign: "center" },
  row:        { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  label:      { flex: 1, fontSize: 16 },
  input:      { flex: 1, borderWidth: 1, borderRadius: 6, padding: 8 },
  button:     { marginTop: 32, backgroundColor: "#1a1a1a", padding: 16, borderRadius: 8 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "600" },
});
