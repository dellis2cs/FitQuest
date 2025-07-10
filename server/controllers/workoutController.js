const { supabase } = require("../db/supabaseClient");

const createWorkout = async (req, res) => {
  console.log("Creating Workout");
  try {
    // 1) pull the user’s profile ID
    const profile_id = req.user.id;
    const { performed_at, movements } = req.body;
    if (!Array.isArray(movements) || movements.length === 0) {
      return res.status(400).json({ message: "Invalid movements array" });
    }

    // 2) insert the parent session with profile_id
    const { data: session, error: sessErr } = await supabase
      .from("workout_sessions")
      .insert({ profile_id, performed_at })
      .select("id")
      .single();
    if (sessErr) {
      console.error("Session insert error:", sessErr);
      return res.status(500).json({ message: sessErr.message });
    }

    // 3) prepare child rows, stamping in both profile_id and session_id
    const toInsert = movements.map((m) => ({
      profile_id, // <— include this!
      session_id: session.id, // stamp all movements with same session
      movement: m.movement,
      weight: m.weight,
      reps: m.reps,
      duration_seconds: m.duration_seconds,
      stat_category: m.stat_category,
      xp_awarded: m.xp_awarded,
    }));

    // 4) bulk insert movements
    const { error: movErr } = await supabase
      .from("workout_movements")
      .insert(toInsert);
    if (movErr) {
      console.error("Movements insert error:", movErr);
      return res.status(500).json({ message: movErr.message });
    }

    return res.status(201).json({ session_id: session.id });
  } catch (err) {
    console.error("Server error in createWorkout:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const getWorkouts = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { data, error } = await supabase
      .from("workout_movements")
      .select(
        `
        id,
        movement,
        weight,
        reps,
        duration_seconds,
        stat_category,
        xp_awarded,
        performed_at
        `
      )
      .eq("profile_id", userId)
      .order("performed_at", { ascending: false });
    if (error) {
      console.error("Error fetching workout sessions:", error);
      return res.status(500).json({ message: error.message });
    }

    const workouts = data.map((w) => ({
      id: w.id,
      movement: w.movement,
      weight: w.weight,
      reps: w.reps,
      duration_seconds: w.duration_seconds,
      stat_category: w.stat_category,
      xp_awarded: w.xp_awarded,
      performed_at: w.performed_at,
    }));
    console.log("Workouts fetched successfully:", workouts);
    return res.json(workouts);
  } catch (err) {
    console.error("Server error in getWorkouts:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const getSessions = async (req, res) => {
  const profile_id = req.user.id;

  // 1) fetch sessions *with* their movements
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(
      `
      id,
      performed_at,
      workout_movements (
        xp_awarded
      )
    `
    )
    .eq("profile_id", profile_id)
    .order("performed_at", { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  // 2) map into a flat shape with counts & sum
  const sessions = data.map((s) => {
    const count = s.workout_movements.length;
    const totalXp = s.workout_movements.reduce(
      (sum, m) => sum + (m.xp_awarded || 0),
      0
    );
    return {
      id: s.id,
      performed_at: s.performed_at,
      movement_count: count,
      total_xp: totalXp,
    };
  });

  console.log(sessions);

  return res.json(sessions);
};

const getSessionDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { data, error } = await supabase
      .from("workout_movements")
      .select(
        `
        id,
        movement,
        weight,
        reps,
        duration_seconds,
        stat_category,
        xp_awarded,
        performed_at
        `
      )
      .eq("profile_id", userId)
      .eq("session_id", sessionId)
      .order("performed_at", { ascending: false });
    if (error) {
      console.error("Error fetching workout sessions:", error);
      return res.status(500).json({ message: error.message });
    }

    const workouts = data.map((w) => ({
      id: w.id,
      movement: w.movement,
      weight: w.weight,
      reps: w.reps,
      duration_seconds: w.duration_seconds,
      stat_category: w.stat_category,
      xp_awarded: w.xp_awarded,
      performed_at: w.performed_at,
    }));
    console.log("Workouts fetched successfully:", workouts);
    return res.json(workouts);
  } catch (err) {
    console.error("Server error in getWorkouts:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createWorkout, getWorkouts, getSessions, getSessionDetails };
