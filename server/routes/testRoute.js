// routes/testRoute.js
const router = require("express").Router();
const { run } = require("../controllers/testController");

router.post("/profiles", run);
module.exports = router;
