const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const { searchUsers } = require("../controllers/friendController");

router.get("/search", protect, searchUsers);
