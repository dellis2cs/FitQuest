const express = require("express");
const app = express();
const dotenv = require("dotenv").config();
const cors = require("cors");
// const testRouter = require("./routes/testRoute");
const authRouter = require("./routes/authRoute");
const profileRouter = require("./routes/profileRoute");
const workoutRouter = require("./routes/workoutRoute");
const friendRouter = require("./routes/friendRoute");
const guildRouter = require("./routes/guildRoute");

app.use(cors());
app.use(express.json());

app.use(authRouter);
app.use(profileRouter);
app.use(workoutRouter);
app.use(friendRouter);
app.use(guildRouter);

app.get("/", (req, res) => {
  res.send("Hello from Node API Server Updated");
  console.log("test works");
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, "0.0.0.0", () => console.log(`listening on port ${PORT}`));
