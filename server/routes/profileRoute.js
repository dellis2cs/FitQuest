const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const {
  getProfile,
  getUserProfile,
  setMaxes,
} = require("../controllers/profileController");

router.get("/profile", protect, getProfile);
router.get("/profile/:userId", protect, getUserProfile);
router.post("/maxes", protect, setMaxes);

module.exports = router;
