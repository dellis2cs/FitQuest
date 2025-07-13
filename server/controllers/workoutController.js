// controllers/workoutController.js
const { supabase } = require("../db/supabaseClient");
const { xpForLevel } = require("./profileController");

function bumpLevel(currentXp, currentLevel) {
  let lvl = currentLevel;
  while (currentXp >= xpForLevel(lvl + 1)) {
    lvl++;
  }
  return lvl;
}

function calcStatXP({ reps, weight, duration_seconds, stat_category }) {
  console.log(stat_category);
  if (stat_category === "Stamina") {
    // 1 XP per 10 sec of cardio
    const secs = duration_seconds || 0;
    return Math.floor((secs / 10) * 10);
  }
  // Strength path: K = 10, intensity capped at 1×1RM
  if (!reps || !weight) return 0;
  const intensity = Math.min(weight / 1 /* 1RM? */, 1);
  const K = 10;
  return Math.floor(reps * intensity * K);
}

const createWorkout = async (req, res) => {
  try {
    const profile_id = req.user.id;
    const { performed_at, movements, stat_category } = req.body;
    // console.log(req.body);

    // 1️⃣ Validate inputs
    if (!Array.isArray(movements) || movements.length === 0) {
      return res.status(400).json({ message: "Invalid movements array" });
    }
    // if (!["Weights", "Cardio"].includes(session_type)) {
    //   return res
    //     .status(400)
    //     .json({ message: "session_type must be 'Weights' or 'Cardio'" });
    // }

    // 2️⃣ Compute XP sums from the raw movements array
    const movementsWithXp = movements.map((m) => ({
      ...m,
      xp_awarded: calcStatXP(m),
    }));
    const sessionTotalXp = movementsWithXp.reduce(
      (sum, m) => sum + m.xp_awarded,
      0
    );
    // console.log(movementsWithXp);

    // filter‐and‐sum by movement category
    const weightXp = movementsWithXp
      .filter((m) => m.stat_category === "Strength")
      .reduce((sum, m) => sum + m.xp_awarded, 0);
    const cardioXp = movementsWithXp
      .filter((m) => m.stat_category === "Stamina")
      .reduce((sum, m) => sum + m.xp_awarded, 0);

    // 3️⃣ Decide how much to award into each stat
    let delta = { strength: 0, speed: 0, stamina: 0, durability: 0 };

    // split weight‐movement XP 50/50
    delta.strength = weightXp / 2;
    delta.durability = weightXp / 2;
    // split stamina‐movement (cardio) XP 50/50
    delta.speed = cardioXp / 2;
    delta.stamina = cardioXp / 2;

    console.log(delta);

    // 4️⃣ Fetch the user’s profile
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select(
        `
        total_xp, current_level,
        strength_xp, strength_level,
        speed_xp,    speed_level,
        stamina_xp,  stamina_level,
        durability_xp, durability_level
      `
      )
      .eq("id", profile_id)
      .single();
    if (profErr) throw profErr;

    // 5️⃣ Apply XP deltas
    profile.total_xp += sessionTotalXp;
    profile.strength_xp += delta.strength;
    profile.speed_xp += delta.speed;
    profile.stamina_xp += delta.stamina;
    profile.durability_xp += delta.durability;

    // 6️⃣ Recompute levels
    profile.strength_level = bumpLevel(
      profile.strength_xp,
      profile.strength_level
    );
    profile.speed_level = bumpLevel(profile.speed_xp, profile.speed_level);
    profile.stamina_level = bumpLevel(
      profile.stamina_xp,
      profile.stamina_level
    );
    profile.durability_level = bumpLevel(
      profile.durability_xp,
      profile.durability_level
    );
    profile.current_level = bumpLevel(profile.total_xp, profile.current_level);

    // 7️⃣ Persist the updated profile in one shot
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        total_xp: profile.total_xp,
        current_level: profile.current_level,
        strength_xp: profile.strength_xp,
        strength_level: profile.strength_level,
        speed_xp: profile.speed_xp,
        speed_level: profile.speed_level,
        stamina_xp: profile.stamina_xp,
        stamina_level: profile.stamina_level,
        durability_xp: profile.durability_xp,
        durability_level: profile.durability_level,
      })
      .eq("id", profile_id);
    if (updateErr) throw updateErr;

    // 8️⃣ Insert the workout session
    const { data: session, error: sessErr } = await supabase
      .from("workout_sessions")
      .insert({ profile_id, performed_at, stat_category })
      .select("id")
      .single();
    if (sessErr) throw sessErr;

    // 9️⃣ Bulk‐insert each movement
    const toInsert = movementsWithXp.map((m) => ({
      profile_id,
      session_id: session.id,
      movement: m.movement,
      weight: m.weight,
      reps: m.reps,
      duration_seconds: m.duration_seconds,
      stat_category: m.stat_category,
      xp_awarded: m.xp_awarded,
    }));
    const { error: movErr } = await supabase
      .from("workout_movements")
      .insert(toInsert);
    if (movErr) throw movErr;

    return res.status(201).json({ session_id: session.id });
  } catch (err) {
    console.error("createWorkout error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
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
    // console.log("Workouts fetched successfully:", workouts);
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

  // console.log(sessions);

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
