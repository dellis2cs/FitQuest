const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const {
  searchUsers,
  sendRequest,
  respondRequest,
  listPending,
  listFriends,
} = require("../controllers/friendController");

router.get("/search", protect, searchUsers);
router.get("/friends", protect, listFriends);
router.get("/friend_requests", protect, listPending);
router.post("/friend-requests", protect, sendRequest);
router.post("/friend_requests/:id/respond", protect, respondRequest);

module.exports = router;
