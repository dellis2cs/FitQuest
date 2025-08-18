const { supabase } = require("../db/supabaseClient");

// GET /exercises?search=term&limit=10
const searchExercises = async (req, res) => {
  console.log("searchExercises", req.query);
  try {
    const profileId = req.user?.id;
    const { search = "", limit = 10 } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 10, 50);

    const term = String(search).trim();

    // 1) Global catalog (columns: Id, Title, Type, BodyPart)
    let globalQuery = supabase
      .from("exercises")
      .select("Id, Title, Type, BodyPart")
      .limit(lim)
      .order("Title", { ascending: true });
    if (term) {
      globalQuery = globalQuery.ilike("Title", `%${term}%`);
    }

    // 2) User-defined catalog (expected columns: id, profile_id, title, type, body_part)
    // Note: ensure a `user_exercises` table exists in Supabase with the above columns.
    let userQuery = supabase
      .from("user_exercises")
      .select("id, title, type, body_part")
      .eq("profile_id", profileId)
      .limit(lim)
      .order("title", { ascending: true });
    if (term) {
      userQuery = userQuery.ilike("title", `%${term}%`);
    }

    const [
      { data: globalData, error: globalErr },
      { data: userData, error: userErr },
    ] = await Promise.all([globalQuery, userQuery]);
    if (globalErr) return res.status(500).json({ message: globalErr.message });
    if (userErr) return res.status(500).json({ message: userErr.message });

    const normalizedGlobal = (globalData || [])
      .map((row) => ({
        id: row.Id,
        title: row.Title,
        type: row.Type,
        body_part: row.BodyPart,
        source: "global",
      }))
      .filter((r) => r.id && r.title);

    const normalizedUser = (userData || [])
      .map((row) => ({
        id: row.id,
        title: row.title,
        type: row.type,
        body_part: row.body_part,
        source: "user",
      }))
      .filter((r) => r.id && r.title);

    // Merge and de-dupe by lowercased title
    const merged = [...normalizedUser, ...normalizedGlobal];
    const seen = new Set();
    const deduped = [];
    for (const item of merged) {
      const key = item.title.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
      if (deduped.length >= lim) break;
    }

    console.log({ count: deduped.length });
    return res.json(deduped);
  } catch (err) {
    console.error("searchExercises error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// POST /exercises
// body: { title: string, type: 'Weights'|'Stamina', body_part?: string }
const createExercise = async (req, res) => {
  try {
    const profileId = req.user?.id;
    if (!profileId)
      return res.status(401).json({ message: "Not authenticated" });

    let { title, type, body_part } = req.body || {};
    title = String(title || "").trim();
    type = String(type || "").trim();
    body_part = body_part ? String(body_part).trim() : null;

    if (!title) return res.status(400).json({ message: "'title' is required" });
    if (!type || !["Weights", "Stamina"].includes(type)) {
      return res
        .status(400)
        .json({ message: "'type' must be 'Weights' or 'Stamina'" });
    }

    // Enforce per-user uniqueness by lowercased title
    const { data: existing, error: existErr } = (await supabase
      .from("user_exercises")
      .select("id")
      .eq("profile_id", profileId)
      .ilike("title", title)
      .maybeSingle?.()) ?? { data: null, error: null };
    if (existErr) return res.status(500).json({ message: existErr.message });
    if (existing)
      return res.status(409).json({ message: "Exercise already exists" });

    const { data, error } = await supabase
      .from("user_exercises")
      .insert({ profile_id: profileId, title, type, body_part })
      .select("id, title, type, body_part")
      .single();
    if (error) return res.status(500).json({ message: error.message });

    return res.status(201).json({
      id: data.id,
      title: data.title,
      type: data.type,
      body_part: data.body_part,
    });
  } catch (err) {
    console.error("createExercise error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = { searchExercises, createExercise };
