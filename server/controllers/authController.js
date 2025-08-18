const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { supabase } = require("../db/supabaseClient");
const { sendPasswordResetEmail } = require("../services/emailService");

//Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const signup = async (req, res) => {
  console.log("Signing Up");
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

// Request password reset: generate single-use token and store with expiry
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  // Always respond 200 to avoid user enumeration; do work silently
  try {
    const { data: user, error: userErr } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .single();

    // If user not found, still pretend success
    if (userErr || !user) {
      return res.json({
        message: "If an account exists, a reset email has been sent.",
      });
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour

    // Insert reset record
    const { error: insertErr } = await supabase.from("password_resets").insert([
      {
        id: uuidv4(),
        user_id: user.id,
        token,
        expires_at: expiresAt,
        used: false,
      },
    ]);

    if (insertErr) {
      console.error("Failed to create password reset token:", insertErr);
      return res.status(500).json({
        message:
          "Could not initiate password reset. Ensure the password_resets table exists. See server/README.md.",
      });
    }

    // Send email with token (deep link included). Do not leak errors to client.
    try {
      await sendPasswordResetEmail(email, token);
    } catch (mailErr) {
      console.error("Failed to send reset email:", mailErr);
    }

    return res.json({
      message: "If an account exists, a reset email has been sent.",
    });
  } catch (err) {
    console.error("requestPasswordReset error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Complete password reset using token
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ message: "Token and newPassword are required" });
  }
  if (typeof newPassword !== "string" || newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  try {
    // Find valid reset token
    const { data: resetRow, error: findErr } = await supabase
      .from("password_resets")
      .select("id, user_id, expires_at, used")
      .eq("token", token)
      .single();

    if (findErr || !resetRow) {
      return res.status(400).json({ message: "Invalid token" });
    }

    if (resetRow.used) {
      return res.status(400).json({ message: "Token already used" });
    }

    const isExpired = new Date(resetRow.expires_at).getTime() < Date.now();
    if (isExpired) {
      return res.status(400).json({ message: "Token expired" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ password: hashedPassword })
      .eq("id", resetRow.user_id);

    if (updateErr) {
      console.error("Password update failed:", updateErr);
      return res.status(500).json({ message: "Could not update password" });
    }

    // Mark token as used
    const { error: markErr } = await supabase
      .from("password_resets")
      .update({ used: true, used_at: new Date().toISOString() })
      .eq("id", resetRow.id);

    if (markErr) {
      console.warn("Failed to mark reset token used:", markErr);
    }

    return res.json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { signup, login, requestPasswordReset, resetPassword };
