const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const {
  createWorkout,
  getWorkouts,
  getSessions,
  getSessionDetails,
} = require("../controllers/workoutController");

router.post("/workout", protect, createWorkout);
router.get("/workouts", protect, getWorkouts);
router.get("/sessions", protect, getSessions);
router.get("/sessions/:sessionId", protect, getSessionDetails);

module.exports = router;
