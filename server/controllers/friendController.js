const { supabase } = require("../db/supabaseClient");

const searchUsers = async (req, res) => {
  const { search } = req.query;

  const { user } = req;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, total_xp, level")
    .ilike("username", search)
    .neq("id", user.id)
    .limit(20);
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
  console.log(data);
};

module.exports = { searchUsers };
