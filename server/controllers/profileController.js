// controllers/profileController.js
const { supabase } = require("../db/supabaseClient");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

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
    // console.log("Profile fetched successfully:", data);
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

const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user.id; // The person making the request

    // Fetch the user profile
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
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ message: error.message });
    }

    if (!data) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if they are friends
    const { data: friendshipData } = await supabase
      .from("friend_requests")
      .select("status")
      .or(
        `and(requester_id.eq.${requesterId},recipient_id.eq.${userId}),and(requester_id.eq.${userId},recipient_id.eq.${requesterId})`
      )
      .eq("status", "accepted")
      .single();

    const isFriend = !!friendshipData;
    const isOwnProfile = userId === requesterId;

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

    // Build response - hide sensitive data if not friends and not own profile
    const response = {
      id: raw.id,
      username: raw.username,
      avatar_url: raw.avatar_url,
      total_xp: raw.total_xp,
      current_level: raw.current_level,
      stats: flatStats,
      isFriend,
      isOwnProfile,
    };

    // Only include email and 1RM data if it's their own profile or they are friends
    if (isOwnProfile || isFriend) {
      response.email = raw.email;
      response.bench_1rm = raw.bench_1rm;
      response.squat_1rm = raw.squat_1rm;
      response.deadlift_1rm = raw.deadlift_1rm;
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error("Server error in getUserProfile:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const setMaxes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bench_1rm, squat_1rm, deadlift_1rm } = req.body;
    console.log("Received maxes:", { bench_1rm, squat_1rm, deadlift_1rm });
    if (
      ![bench_1rm, squat_1rm, deadlift_1rm].every((n) => typeof n === "number")
    ) {
      return res
        .status(400)
        .json({ message: "bench, squat, deadlift must be numbers" });
    }
    const { error } = await supabase
      .from("profiles")
      .update({ bench_1rm, squat_1rm, deadlift_1rm })
      .eq("id", userId);
    if (error) throw error;
    return res.status(200).json({ message: "Maxes saved" });
  } catch (err) {
    console.error("Error in setMaxes:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, currentPassword, newPassword } = req.body;

    console.log("Update profile request:", {
      username,
      email,
      hasPassword: !!currentPassword,
    });

    // Prepare update object
    const updateData = {};

    // Handle username update
    if (username && username.trim()) {
      // Check if username is taken by another user
      const { data: existingUser, error: userCheckError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .neq("id", userId)
        .maybeSingle();

      if (userCheckError && userCheckError.code !== "PGRST116") {
        console.error("Username check error:", userCheckError);
        return res
          .status(500)
          .json({ message: "Error checking username availability" });
      }

      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      updateData.username = username;
    }

    // Handle email update
    if (email && email.trim()) {
      // Check if email is taken by another user
      const { data: existingEmail, error: emailCheckError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .neq("id", userId)
        .maybeSingle();

      if (emailCheckError && emailCheckError.code !== "PGRST116") {
        console.error("Email check error:", emailCheckError);
        return res
          .status(500)
          .json({ message: "Error checking email availability" });
      }

      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      updateData.email = email;
    }

    // Handle password update
    if (currentPassword && newPassword) {
      // Verify current password
      const { data: user, error: fetchError } = await supabase
        .from("profiles")
        .select("password")
        .eq("id", userId)
        .single();

      if (fetchError || !user) {
        return res.status(400).json({ message: "Error verifying password" });
      }

      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isValidPassword) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(newPassword, salt);
    }

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No changes to update" });
    }

    // Update profile
    updateData.updated_at = new Date().toISOString();

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select("id, username, email, avatar_url")
      .single();

    if (updateError) {
      console.error("Profile update error:", updateError);
      return res.status(500).json({ message: "Failed to update profile" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// Separate endpoint for avatar upload
const updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const avatarFile = req.file;

    console.log("Avatar upload request:", { hasFile: !!avatarFile });

    if (!avatarFile) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Create a separate Supabase client with service role key for storage operations
    const { createClient } = require("@supabase/supabase-js");
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY // This bypasses RLS
    );

    // Get current avatar URL to delete old file
    const { data: currentProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    if (fetchError) {
      console.error("Error fetching current profile:", fetchError);
      return res.status(500).json({ message: "Error updating avatar" });
    }

    console.log("Current avatar URL:", currentProfile?.avatar_url);

    // Delete all existing avatars for this user
    try {
      // List all files in the user's folder
      const { data: existingFiles, error: listError } =
        await supabaseAdmin.storage.from("avatars").list(userId, {
          limit: 100,
          offset: 0,
        });

      if (listError) {
        console.error("Error listing files:", listError);
      } else if (existingFiles && existingFiles.length > 0) {
        // Delete all existing files for this user
        const filesToDelete = existingFiles.map(
          (file) => `${userId}/${file.name}`
        );
        console.log("Files found in user folder:", filesToDelete);

        const { data: deleteData, error: deleteError } =
          await supabaseAdmin.storage.from("avatars").remove(filesToDelete);

        if (deleteError) {
          console.error("Error deleting old avatars:", deleteError);
        } else {
          console.log("Successfully deleted old avatars:", deleteData);
        }
      } else {
        console.log("No existing files found in user folder");
      }
    } catch (error) {
      console.error("Error in cleanup process:", error);
      // Continue with upload even if cleanup fails
    }

    // Upload new avatar using admin client
    const fileExt = avatarFile.originalname.split(".").pop() || "jpg";
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(filePath, avatarFile.buffer, {
        contentType: avatarFile.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);
      return res.status(500).json({ message: "Failed to upload avatar" });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("avatars").getPublicUrl(filePath);

    // Update profile with new avatar URL
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating avatar URL:", updateError);
      // Try to delete the uploaded file
      await supabaseAdmin.storage.from("avatars").remove([filePath]);
      return res.status(500).json({ message: "Failed to update avatar URL" });
    }

    res.status(200).json({
      message: "Avatar updated successfully",
      avatar_url: publicUrl,
    });
  } catch (err) {
    console.error("Update avatar error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = {
  getProfile,
  getUserProfile,
  xpForLevel,
  setMaxes,
  updateProfile,
  updateAvatar,
};
