// testInsert.js
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const { v4: uuidv4 } = require("uuid"); // npm install uuid

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.run = async (req, res) => {
  // 1) If your profiles.id references auth.users.id, first sign up a user:
  // const { data: user } = await supabase.auth.signUp({ email: 'foo@bar.com', password: 'password' });
  // const userId = user.id;

  // 2) Or just generate your own UUID:
  const userId = uuidv4();

  const { data, error } = await supabase.from("profiles").insert([
    {
      id: userId,
      username: "testuser",
      email: "test@example.com",
      // …any other non-nullable columns
    },
  ]);

  if (error) {
    console.error("Insert failed:", error);
  } else {
    console.log("Inserted row:", data);
  }
};
