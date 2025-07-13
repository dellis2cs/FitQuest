const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const { getProfile, setMaxes } = require("../controllers/profileController");

router.get("/profile", protect, getProfile);
router.post("/maxes", protect, setMaxes);

module.exports = router;
