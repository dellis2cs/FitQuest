const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { supabase } = require("../db/supabaseClient");

//Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const signup = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ message: "Please fill in all fields" });
    return;
  }

  //Check if user exists
  const { data: existing, error: selectErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (selectErr && selectErr.code !== "PGRST116") {
    // some DB error other than “no rows returned”
    return res.status(500).json({ message: selectErr.message });
  }
  if (existing) {
    return res.status(400).json({ message: "User already exists" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const userId = uuidv4();

  const { data: newUser, error: insertErr } = await supabase
    .from("profiles")
    .insert([
      {
        id: userId,
        username,
        email,
        password: hashedPassword,
      },
    ])
    .select()
    .single();

  if (insertErr) {
    return res.status(500).json({ message: insertErr.message });
  }

  const token = generateToken(newUser.id);
  res.status(201).json({
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    token,
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Please provide email and password" });
    return;
  }

  //1. Fetch user by email
  const { data: user, error: selectErr } = await supabase
    .from("profiles")
    .select("id, username, email, password")
    .eq("email", email)
    .single();

  //2. Check if user exists and credentials are correct
  if (selectErr || !user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid password" });
  }

  //3. Generate token
  const token = generateToken(user.id);

  //4. Send token to client
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    token,
  });
};

module.exports = { signup, login };
