const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const {
  createWorkout,
  getWorkouts,
  getSessions,
  getSessionDetails,
  getWorkoutStreak,
  getSessionsPaginated,
} = require("../controllers/workoutController");
const { searchExercises } = require("../controllers/exerciseController");

router.post("/workout", protect, createWorkout);
router.get("/workouts", protect, getWorkouts);
router.get("/sessions", protect, getSessions);
router.get("/sessions/paginated", protect, getSessionsPaginated);
router.get("/sessions/:sessionId", protect, getSessionDetails);
router.get("/workout-streak", protect, getWorkoutStreak);
router.get("/exercises", protect, searchExercises);

module.exports = router;
