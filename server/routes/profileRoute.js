const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const { getProfile } = require("../controllers/profileController");

router.get("/profile", protect, getProfile);

module.exports = router;
