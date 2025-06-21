// testInsert.js
require("dotenv").config();
const { v4: uuidv4 } = require("uuid"); // npm install uuid

const { supabase } = require("../db/supabaseClient");

exports.run = async () => {
  //generate UUID:
  const userId = uuidv4();

  const { data, error } = await supabase.from("profiles").insert([
    {
      id: userId,
      username: "testuser3",
      email: "test3@example.com",
    },
  ]);

  if (error) {
    console.error("Insert failed:", error);
  } else {
    console.log("Inserted row:", data);
  }
};
