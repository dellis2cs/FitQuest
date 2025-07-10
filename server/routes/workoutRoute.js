const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const {
  createWorkout,
  getWorkouts,
} = require("../controllers/workoutController");

router.post("/workout", protect, createWorkout);
router.get("/workouts", protect, getWorkouts);

module.exports = router;
