// controllers/profileController.js
const { supabase } = require("../db/supabaseClient");

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
        current_level
      `
      )
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return res.status(500).json({ message: error.message });
    }

    // 3️⃣ Return the raw row; your front-end can camelCase or map as needed
    console.log("Profile fetched successfully:", data);
    return res.status(200).json(data);
  } catch (err) {
    console.error("Server error in getProfile:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getProfile };
