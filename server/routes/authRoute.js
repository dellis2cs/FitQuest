const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const {
  signup,
  login,
  requestPasswordReset,
  resetPassword,
} = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);
router.post("/auth/request-password-reset", requestPasswordReset);
router.post("/auth/reset-password", resetPassword);

module.exports = router;
