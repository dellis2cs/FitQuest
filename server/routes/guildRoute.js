// routes/guildRoute.js
const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const {
  getGuildStats,
  getGuildsPaginated,
  getGuildById,
  createGuild,
  joinGuild,
  leaveGuild,
} = require("../controllers/guildController");

// Guild statistics
router.get("/guild-stats", protect, getGuildStats);

// Guild CRUD operations
router.get("/guilds/paginated", protect, getGuildsPaginated);
router.get("/guilds/:guildId", protect, getGuildById);
router.post("/guilds", protect, createGuild);

// Guild membership
router.post("/guilds/:guildId/join", protect, joinGuild);
router.post("/guilds/:guildId/leave", protect, leaveGuild);

module.exports = router;
