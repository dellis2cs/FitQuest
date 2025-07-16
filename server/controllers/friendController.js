const { supabase } = require("../db/supabaseClient");

const searchUsers = async (req, res) => {
  const { search } = req.query;

  const { user } = req;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, total_xp, current_level")
    .ilike("username", search)
    .neq("id", user.id)
    .limit(20);
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
  console.log(data);
};

const sendRequest = async (req, res) => {
  const { recipient_username } = req.body;
  const requester_id = req.user.id;

  // Lookup recipient
  const { data: recipient, error: lookupErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", recipient_username)
    .single();
  if (lookupErr || !recipient) {
    return res.status(404).json({ message: "User not found" });
  }
  const recipient_id = recipient.id;

  if (recipient_id === requester_id) {
    return res.status(400).json({ message: "Cannot send request to yourself" });
  }

  // Insert pending request
  const { error: insertErr } = await supabase
    .from("friend_requests")
    .insert({ requester_id, recipient_id, status: "pending" });

  if (insertErr) {
    // Unique constraint violation
    if (insertErr.code === "23505") {
      return res.status(409).json({ message: "Request already exists" });
    }
    return res.status(500).json({ message: insertErr.message });
  }
  return res.status(201).json({ message: "Friend request sent" });
};

const listPending = async (req, res) => {
  const recipient_id = req.user.id;

  const { data, error } = await supabase
    .from("friend_requests")
    .select(
      `id, created_at,
       requester:profiles!friend_requests_requester_id_fkey(id, username, avatar_url)`
    )
    .eq("recipient_id", recipient_id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  const pending = data.map((row) => ({
    request_id: row.id,
    requested_at: row.created_at,
    requester_id: row.requester.id,
    requester_username: row.requester.username,
    requester_avatar: row.requester.avatar_url,
  }));

  return res.json(pending);
};

// in friendController.js
async function respondRequest(req, res) {
  const { id } = req.params; // the request’s PK
  const { action } = req.body; // 'accept' or 'reject'
  const userId = req.user.id;

  // only the recipient can respond
  const { data: fr, error: fetchErr } = await supabase
    .from("friend_requests")
    .select("requester_id, recipient_id")
    .eq("id", id)
    .single();
  if (fetchErr) return res.status(400).json({ message: "Invalid request" });
  if (fr.recipient_id !== userId) return res.status(403).end();

  // update the status
  const newStatus = action === "accept" ? "accepted" : "rejected";
  const { error: updateErr } = await supabase
    .from("friend_requests")
    .update({ status: newStatus })
    .eq("id", id);
  if (updateErr) return res.status(500).json({ message: updateErr.message });

  return res.status(200).json({ id, status: newStatus });
}

async function listFriends(req, res) {
  const userId = req.user.id;

  // grab id, username, avatar_url, total_xp, current_level from both sides
  const { data, error } = await supabase
    .from("friend_requests")
    .select(
      `
      requester:requester_id (
        id,
        username,
        avatar_url,
        total_xp,
        current_level
      ),
      recipient:recipient_id (
        id,
        username,
        avatar_url,
        total_xp,
        current_level
      )
    `
    )
    .or(
      `and(requester_id.eq.${userId},status.eq.accepted),and(recipient_id.eq.${userId},status.eq.accepted)`
    );

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  // normalize into one flat list with the fields your front-end needs
  const friends = data.map((row) => {
    const isRequester = row.requester.id === userId;
    const other = isRequester ? row.recipient : row.requester;
    return {
      id: other.id,
      username: other.username,
      avatar_url: other.avatar_url,
      total_xp: other.total_xp,
      current_level: other.current_level,
    };
  });

  return res.json(friends);
}

module.exports = {
  searchUsers,
  sendRequest,
  listPending,
  respondRequest,
  listFriends,
};
