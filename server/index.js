const express = require("express");
const app = express();
const dotenv = require("dotenv").config();
const cors = require("cors");
// const testRouter = require("./routes/testRoute");
const authRouter = require("./routes/authRoute");

app.use(cors());
app.use(express.json());

app.use(authRouter);

app.get("/", (req, res) => {
  res.send("Hello from Node API Server Updated");
  console.log("test works");
});

PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
