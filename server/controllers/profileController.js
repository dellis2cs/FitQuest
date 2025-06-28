// controllers/profileController.js
const { supabase } = require("../db/supabaseClient");

function xpForLevel(level, baseXp = 100, growthRate = 1.5) {
  if (level <= 1) return 0;
  return baseXp * Math.pow(growthRate, level - 1);
}

const getProfile = async (req, res) => {
  try {
    // 1️⃣ req.user.id was set by your protect middleware
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // 2️⃣ Select exactly the columns you need from profiles
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        id,
        username,
        email,
        avatar_url,
        bench_1rm,
        squat_1rm,
        deadlift_1rm,
        total_xp,
        current_level,
        strength_level,
        strength_xp,
        speed_level,
        speed_xp,
        stamina_level,
        stamina_xp,
        durability_level,
        durability_xp
      `
      )
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return res.status(500).json({ message: error.message });
    }

    const raw = data;
    const flatStats = [
      {
        title: "Strength",
        level: raw.strength_level,
        xp: raw.strength_xp,
        icon: "💪",
      },
      {
        title: "Speed",
        level: raw.speed_level,
        xp: raw.speed_xp,
        icon: "⚡",
      },
      {
        title: "Stamina",
        level: raw.stamina_level,
        xp: raw.stamina_xp,
        icon: "🫁",
      },
      {
        title: "Durability",
        level: raw.durability_level,
        xp: raw.durability_xp,
        icon: "🤸",
      },
    ].map(({ title, level, xp, icon }) => {
      const prevThresh = xpForLevel(level);
      const nextThresh = xpForLevel(level + 1);
      const xpInLevel = Math.max(0, xp - prevThresh);
      const needed = nextThresh - prevThresh;
      const percent = Math.min(Math.max((xpInLevel / needed) * 100, 0), 100);
      return {
        title,
        level,
        currentXp: xp,
        nextLevelXp: nextThresh,
        xpToNextLevel: Math.max(0, nextThresh - xp),
        percentComplete: percent,
        icon,
      };
    });

    // 3️⃣ Return the raw row; your front-end can camelCase or map as needed
    console.log("Profile fetched successfully:", data);
    return res.status(200).json({
      id: raw.id,
      username: raw.username,
      email: raw.email,
      avatar_url: raw.avatar_url,
      bench_1rm: raw.bench_1rm,
      squat_1rm: raw.squat_1rm,
      deadlift_1rm: raw.deadlift_1rm,
      total_xp: raw.total_xp,
      current_level: raw.current_level,
      stats: flatStats,
    });
  } catch (err) {
    console.error("Server error in getProfile:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getProfile };
