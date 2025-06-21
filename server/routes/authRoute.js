const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const { signup, login } = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);

module.exports = router;
