// controllers/guildController.js
const { supabase } = require("../db/supabaseClient");
const { v4: uuidv4 } = require("uuid");

// Get guild statistics for the current user
const getGuildStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's guild memberships
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("guild_id")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return res.status(500).json({ message: profileError.message });
    }

    // Count joined guilds (for now just 1 since user can only be in one guild based on schema)
    const joinedGuilds = userProfile.guild_id ? 1 : 0;

    // Get total XP earned (this would need to be tracked separately in a guild_contributions table)
    // For now, we'll use a placeholder
    const totalXpEarned = 0;

    // Get average guild level of guilds user has been part of
    let averageGuildLevel = 0;
    if (userProfile.guild_id) {
      const { data: guild } = await supabase
        .from("guilds")
        .select("level")
        .eq("id", userProfile.guild_id)
        .single();

      if (guild) {
        averageGuildLevel = guild.level;
      }
    }

    // Get total guilds count
    const { count: totalGuilds } = await supabase
      .from("guilds")
      .select("*", { count: "exact", head: true });

    // Placeholder for favorite category - would need activity tracking
    const favoriteCategory = "Fitness";

    return res.json({
      totalGuilds: totalGuilds || 0,
      joinedGuilds,
      totalXpEarned,
      averageGuildLevel,
      favoriteCategory,
    });
  } catch (err) {
    console.error("getGuildStats error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// Get paginated guilds with optional category filter
const getGuildsPaginated = async (req, res) => {
  try {
    const userId = req.user.id;
    const { offset = 0, limit = 10, category } = req.query;

    // Get user's current guild
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("guild_id")
      .eq("id", userId)
      .single();

    // Build query
    let query = supabase.from("guilds").select("*", { count: "exact" });

    // Add category filter if provided
    if (category && category !== "All") {
      // For now, using name filter as placeholder for category
      // You might want to add a category column to guilds table
      query = query.ilike("name", `%${category}%`);
    }

    // Add pagination
    const {
      data: guilds,
      error,
      count,
    } = await query
      .order("created_at", { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      console.error("Error fetching guilds:", error);
      return res.status(500).json({ message: error.message });
    }

    // Add is_member flag and mock category
    const guildsWithMembership = guilds.map((guild) => ({
      ...guild,
      is_member: guild.id === userProfile?.guild_id,
      category: "Fitness", // Mock category - you should add this to your schema
      xp: guild.total_xp,
    }));

    return res.json({
      guilds: guildsWithMembership,
      total: count,
      hasMore: parseInt(offset) + parseInt(limit) < count,
    });
  } catch (err) {
    console.error("getGuildsPaginated error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// Get single guild details
const getGuildById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { guildId } = req.params;

    // Get guild details
    const { data: guild, error: guildError } = await supabase
      .from("guilds")
      .select("*")
      .eq("id", guildId)
      .single();

    if (guildError || !guild) {
      return res.status(404).json({ message: "Guild not found" });
    }

    // Get user's membership status
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("guild_id, guild_role")
      .eq("id", userId)
      .single();

    const isMember = userProfile?.guild_id === guildId;
    const userRole = isMember ? userProfile.guild_role : null;

    // Get guild members
    const { data: members, error: membersError } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, total_xp, current_level, guild_role")
      .eq("guild_id", guildId)
      .order("total_xp", { ascending: false })
      .limit(10); // Top 10 members

    if (membersError) {
      console.error("Error fetching guild members:", membersError);
    }

    return res.json({
      ...guild,
      is_member: isMember,
      user_role: userRole,
      top_members: members || [],
      category: "Fitness", // Mock category
    });
  } catch (err) {
    console.error("getGuildById error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// Create a new guild
const createGuild = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      description,
      guild_tag,
      is_public = true,
      max_members = 50,
    } = req.body;

    // Validate required fields
    if (!name || !description || !guild_tag) {
      return res.status(400).json({
        message: "Name, description, and guild tag are required",
      });
    }

    // Check if user is already in a guild
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("guild_id")
      .eq("id", userId)
      .single();

    if (userProfile?.guild_id) {
      return res.status(400).json({
        message: "You must leave your current guild before creating a new one",
      });
    }

    // Check if guild tag is unique
    const { data: existingGuild } = await supabase
      .from("guilds")
      .select("id")
      .eq("guild_tag", guild_tag)
      .single();

    if (existingGuild) {
      return res.status(400).json({
        message: "Guild tag already taken",
      });
    }

    // Create the guild
    const guildId = uuidv4();
    const { data: newGuild, error: createError } = await supabase
      .from("guilds")
      .insert({
        id: guildId,
        name,
        description,
        guild_tag,
        is_public,
        max_members,
        created_by: userId,
        member_count: 1,
        level: 1,
        total_xp: 0,
        battle_wins: 0,
        battle_losses: 0,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating guild:", createError);
      return res.status(500).json({ message: createError.message });
    }

    // Update user profile to join the guild as leader
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        guild_id: guildId,
        guild_role: "leader",
      })
      .eq("id", userId);

    if (updateError) {
      // Rollback guild creation if user update fails
      await supabase.from("guilds").delete().eq("id", guildId);
      return res
        .status(500)
        .json({ message: "Failed to join guild as leader" });
    }

    return res.status(201).json({
      message: "Guild created successfully",
      guild: newGuild,
    });
  } catch (err) {
    console.error("createGuild error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// Join a guild
const joinGuild = async (req, res) => {
  try {
    const userId = req.user.id;
    const { guildId } = req.params;

    // Check if user is already in a guild
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("guild_id")
      .eq("id", userId)
      .single();

    if (userProfile?.guild_id) {
      return res.status(400).json({
        message: "You must leave your current guild before joining another",
      });
    }

    // Check if guild exists and has space
    const { data: guild, error: guildError } = await supabase
      .from("guilds")
      .select("id, member_count, max_members, is_public")
      .eq("id", guildId)
      .single();

    if (guildError || !guild) {
      return res.status(404).json({ message: "Guild not found" });
    }

    if (guild.member_count >= guild.max_members) {
      return res.status(400).json({ message: "Guild is full" });
    }

    if (!guild.is_public) {
      return res.status(403).json({
        message: "This guild is private. You need an invitation to join.",
      });
    }

    // Join the guild
    const { error: joinError } = await supabase
      .from("profiles")
      .update({
        guild_id: guildId,
        guild_role: "member",
      })
      .eq("id", userId);

    if (joinError) {
      return res.status(500).json({ message: joinError.message });
    }

    // Update guild member count
    const { error: updateError } = await supabase
      .from("guilds")
      .update({ member_count: guild.member_count + 1 })
      .eq("id", guildId);

    if (updateError) {
      // Rollback user update if guild update fails
      await supabase
        .from("profiles")
        .update({ guild_id: null, guild_role: null })
        .eq("id", userId);
      return res
        .status(500)
        .json({ message: "Failed to update guild member count" });
    }

    return res.json({ message: "Successfully joined guild" });
  } catch (err) {
    console.error("joinGuild error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// Leave a guild
const leaveGuild = async (req, res) => {
  try {
    const userId = req.user.id;
    const { guildId } = req.params;

    // Check if user is in this guild
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("guild_id, guild_role")
      .eq("id", userId)
      .single();

    if (profileError || userProfile.guild_id !== guildId) {
      return res
        .status(400)
        .json({ message: "You are not a member of this guild" });
    }

    // Check if user is the leader
    if (userProfile.guild_role === "leader") {
      // Check if there are other members
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("guild_id", guildId)
        .neq("id", userId);

      if (count > 0) {
        return res.status(400).json({
          message:
            "Guild leader cannot leave while there are other members. Transfer leadership first.",
        });
      }
    }

    // Leave the guild
    const { error: leaveError } = await supabase
      .from("profiles")
      .update({
        guild_id: null,
        guild_role: null,
      })
      .eq("id", userId);

    if (leaveError) {
      return res.status(500).json({ message: leaveError.message });
    }

    // Update guild member count
    const { data: guild } = await supabase
      .from("guilds")
      .select("member_count")
      .eq("id", guildId)
      .single();

    if (guild) {
      await supabase
        .from("guilds")
        .update({ member_count: Math.max(0, guild.member_count - 1) })
        .eq("id", guildId);
    }

    return res.json({ message: "Successfully left guild" });
  } catch (err) {
    console.error("leaveGuild error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = {
  getGuildStats,
  getGuildsPaginated,
  getGuildById,
  createGuild,
  joinGuild,
  leaveGuild,
};
