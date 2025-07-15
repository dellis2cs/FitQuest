const searchUsers = async (req, res) => {
  const { search } = req.query;
  const { user } = req;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .ilike("username", `%${search}%`)
    .neq("id", user.id)
    .limit(20);
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
};

module.exports = { searchUsers };
